from __future__ import annotations

import argparse
import json
import os
import ssl
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fetch_posters import get_tmdb_credentials, load_dotenv


MOVIES_PATH = Path("viz/movies_data.json")
CACHE_PATH = Path("data/tmdb_movie_details_cache.json")

LATIN_AMERICAN = {
    "AR", "BO", "BR", "BZ", "CL", "CO", "CR", "CU", "DO", "EC", "SV", "GT",
    "GY", "HT", "HN", "JM", "MX", "NI", "PA", "PY", "PE", "PR", "SR", "TT",
    "UY", "VE",
}
EUROPEAN = {
    "AL", "AD", "AM", "AT", "AZ", "BY", "BE", "BA", "BG", "HR", "CY", "CZ",
    "DK", "EE", "FI", "FR", "GE", "DE", "GR", "HU", "IS", "IE", "IT", "XK",
    "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL",
    "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "TR", "UA",
    "GB", "VA",
}
MIDDLE_EASTERN_AFRICAN = {
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG",
    "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN",
    "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ",
    "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD",
    "TZ", "TG", "TN", "UG", "ZM", "ZW", "BH", "IR", "IQ", "IL", "JO", "KW",
    "LB", "OM", "PS", "QA", "SA", "SY", "AE", "YE",
}
ASIAN = {
    "AF", "BD", "BT", "BN", "KH", "CN", "HK", "IN", "ID", "JP", "KZ", "KG",
    "LA", "MO", "MY", "MV", "MN", "MM", "NP", "KP", "PK", "PH", "SG", "KR",
    "LK", "TW", "TJ", "TH", "TL", "TM", "UZ", "VN",
}

MAJOR_STUDIO_MARKERS = (
    "20th century", "amazon mgm", "columbia pictures", "dreamworks", "lucasfilm",
    "marvel studios", "metro-goldwyn-mayer", "mgm", "new line cinema", "paramount",
    "pixar", "searchlight pictures", "sony pictures", "universal pictures",
    "walt disney", "warner bros", "warner brothers",
)
INDEPENDENT_KEYWORDS = ("independent film", "indie film", "independent cinema")

_cache_lock = threading.Lock()


def create_ssl_context(insecure_ssl: bool) -> ssl.SSLContext:
    if insecure_ssl:
        return ssl._create_unverified_context()
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def request_details(
    tmdb_id: str,
    api_key: str | None,
    bearer_token: str | None,
    insecure_ssl: bool,
) -> dict | None:
    query = {"language": "en-US", "append_to_response": "keywords"}
    if api_key and not bearer_token:
        query["api_key"] = api_key
    url = f"https://api.themoviedb.org/3/movie/{int(float(tmdb_id))}?{urlencode(query)}"
    headers = {"Accept": "application/json"}
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"

    for attempt in range(5):
        try:
            with urlopen(
                Request(url, headers=headers),
                timeout=30,
                context=create_ssl_context(insecure_ssl),
            ) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code == 429:
                time.sleep(1.5 * (attempt + 1))
                continue
            if error.code == 404:
                return None
            time.sleep(0.5 * (attempt + 1))
        except (TimeoutError, URLError, ConnectionError, OSError):
            time.sleep(0.5 * (attempt + 1))
    return None


def compact_details(data: dict | None) -> dict:
    if not data:
        return {}
    return {
        "originalLanguage": data.get("original_language"),
        "spokenLanguages": sorted(
            {item.get("iso_639_1") for item in data.get("spoken_languages", []) if item.get("iso_639_1")}
        ),
        "productionCountries": sorted(
            {item.get("iso_3166_1") for item in data.get("production_countries", []) if item.get("iso_3166_1")}
        ),
        "productionCompanies": sorted(
            {item.get("name") for item in data.get("production_companies", []) if item.get("name")}
        ),
        "keywords": sorted(
            {item.get("name") for item in data.get("keywords", {}).get("keywords", []) if item.get("name")}
        ),
    }


def classify(details: dict) -> dict:
    countries = set(details.get("productionCountries", []))
    companies = [name.casefold() for name in details.get("productionCompanies", [])]
    keywords = [name.casefold() for name in details.get("keywords", [])]
    major_studio = any(marker in company for company in companies for marker in MAJOR_STUDIO_MARKERS)
    regions = []
    if countries & LATIN_AMERICAN:
        regions.append("latin_american")
    if countries & EUROPEAN:
        regions.append("european")
    if countries & MIDDLE_EASTERN_AFRICAN:
        regions.append("middle_east_african")
    if countries & ASIAN:
        regions.append("asian")
    return {
        "regions": regions,
        "hollywood": "US" in countries and major_studio,
        "independent": (
            not major_studio
            and any(marker in keyword for keyword in keywords for marker in INDEPENDENT_KEYWORDS)
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich movies with TMDB country, language, and studio data.")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--insecure-ssl", action="store_true")
    args = parser.parse_args()

    load_dotenv(Path(".env"))
    api_key, bearer_token = get_tmdb_credentials()
    if not api_key and not bearer_token:
        raise SystemExit("Add TMDB_API_KEY or TMDB_BEARER_TOKEN to .env first.")

    movies = json.loads(MOVIES_PATH.read_text(encoding="utf-8"))
    cache: dict[str, dict] = json.loads(CACHE_PATH.read_text()) if CACHE_PATH.exists() else {}
    tmdb_ids = sorted({str(movie["tmdbId"]) for movie in movies if movie.get("tmdbId")})
    missing = [tmdb_id for tmdb_id in tmdb_ids if tmdb_id not in cache]

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(request_details, tmdb_id, api_key, bearer_token, args.insecure_ssl): tmdb_id
            for tmdb_id in missing
        }
        completed = 0
        for future in as_completed(futures):
            tmdb_id = futures[future]
            cache[tmdb_id] = compact_details(future.result())
            completed += 1
            if completed % 100 == 0:
                with _cache_lock:
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                print(f"Fetched {completed:,}/{len(missing):,} TMDB records")

    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    counts = {key: 0 for key in ("hollywood", "independent", "latin_american", "european", "middle_east_african", "asian")}
    for movie in movies:
        details = cache.get(str(movie.get("tmdbId")), {})
        classification = classify(details)
        movie.update(details)
        movie.update(classification)
        counts["hollywood"] += classification["hollywood"]
        counts["independent"] += classification["independent"]
        for region in classification["regions"]:
            counts[region] += 1

    MOVIES_PATH.write_text(json.dumps(movies, ensure_ascii=False), encoding="utf-8")
    print(f"Saved TMDB enrichment for {len(movies):,} movies: {counts}")


if __name__ == "__main__":
    main()

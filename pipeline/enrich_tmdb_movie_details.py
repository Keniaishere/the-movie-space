from __future__ import annotations

import argparse
import json
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fetch_posters import get_tmdb_credentials, load_dotenv


MOVIES_PATH = Path("viz/movies_data.json")
CACHE_PATH = Path("data/tmdb_overview_credits_cache.json")


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
    query = {"language": "en-US", "append_to_response": "credits"}
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
            if error.code == 404:
                return None
            if error.code == 429:
                time.sleep(1.5 * (attempt + 1))
            else:
                time.sleep(0.5 * (attempt + 1))
        except (TimeoutError, URLError, ConnectionError, OSError):
            time.sleep(0.5 * (attempt + 1))
    return None


def compact_details(data: dict | None) -> dict:
    if not data:
        return {}
    crew = data.get("credits", {}).get("crew", [])
    directors = []
    for person in crew:
        if person.get("job") == "Director" and person.get("name") not in directors:
            directors.append(person["name"])
    cast = [
        person["name"]
        for person in data.get("credits", {}).get("cast", [])[:9]
        if person.get("name")
    ]
    return {
        "overview": data.get("overview") or "",
        "tagline": data.get("tagline") or "",
        "directors": directors,
        "cast": cast,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Add TMDB synopsis, directors, and cast to movie data.")
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
                CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
                CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                print(f"Fetched {completed:,}/{len(missing):,} movie detail records")

    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    for movie in movies:
        movie.update(cache.get(str(movie.get("tmdbId")), {}))
    MOVIES_PATH.write_text(json.dumps(movies, ensure_ascii=False), encoding="utf-8")
    print(
        f"Saved details for {len(movies):,} movies: "
        f"{sum(bool(movie.get('overview')) for movie in movies):,} synopses, "
        f"{sum(bool(movie.get('directors')) for movie in movies):,} director credits, "
        f"{sum(bool(movie.get('cast')) for movie in movies):,} cast lists."
    )


if __name__ == "__main__":
    main()

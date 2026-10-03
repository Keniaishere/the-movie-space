from __future__ import annotations

import argparse
import json
import ssl
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


MOVIES_PATH = Path("viz/movies_data.json")
CACHE_PATH = Path("data/wikidata_awards_cache.json")
SPARQL_URL = "https://query.wikidata.org/sparql"

OSCAR_MARKERS = ("academy award", "oscar")
FESTIVAL_MARKERS = (
    "cannes",
    "palme d'or",
    "palme d’or",
    "venice film festival",
    "golden lion",
    "silver lion",
    "volpi cup",
    "berlin international film festival",
    "berlinale",
    "golden bear",
    "silver bear",
    "sundance film festival",
    "sundance",
    "grand jury prize",
)


def canonical_imdb_id(value: object) -> str:
    raw = str(value or "").strip().removeprefix("tt")
    return f"tt{raw.zfill(7)}" if raw else ""


def create_ssl_context(insecure_ssl: bool) -> ssl.SSLContext:
    if insecure_ssl:
        return ssl._create_unverified_context()
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def query_awards(imdb_ids: list[str], insecure_ssl: bool) -> dict[str, list[str]]:
    values = " ".join(json.dumps(imdb_id) for imdb_id in imdb_ids)
    query = f"""
SELECT DISTINCT ?imdb ?awardLabel WHERE {{
  VALUES ?imdb {{ {values} }}
  ?film wdt:P345 ?imdb;
        wdt:P166 ?award.
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
"""
    url = f"{SPARQL_URL}?{urlencode({'query': query, 'format': 'json'})}"
    request = Request(
        url,
        headers={
            "Accept": "application/sparql-results+json",
            "User-Agent": "TheMovieSpaceSemesterProject/1.0 (educational project)",
        },
    )
    with urlopen(request, timeout=60, context=create_ssl_context(insecure_ssl)) as response:
        data = json.loads(response.read().decode("utf-8"))

    results: dict[str, list[str]] = {imdb_id: [] for imdb_id in imdb_ids}
    for binding in data["results"]["bindings"]:
        imdb_id = binding["imdb"]["value"]
        label = binding["awardLabel"]["value"]
        if label not in results[imdb_id]:
            results[imdb_id].append(label)
    return results


def classify_awards(award_names: list[str]) -> tuple[bool, bool]:
    normalized = [name.casefold() for name in award_names]
    oscar_winner = any(marker in name for name in normalized for marker in OSCAR_MARKERS)
    festival_winner = any(marker in name for name in normalized for marker in FESTIVAL_MARKERS)
    return oscar_winner, festival_winner


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich movies with Wikidata award wins.")
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--sleep", type=float, default=0.25)
    parser.add_argument("--insecure-ssl", action="store_true")
    args = parser.parse_args()

    movies = json.loads(MOVIES_PATH.read_text(encoding="utf-8"))
    imdb_ids = sorted({canonical_imdb_id(movie.get("imdbId")) for movie in movies} - {""})
    cache: dict[str, list[str]] = (
        json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}
    )
    missing_ids = [imdb_id for imdb_id in imdb_ids if imdb_id not in cache]

    for start in range(0, len(missing_ids), args.batch_size):
        batch = missing_ids[start : start + args.batch_size]
        cache.update(query_awards(batch, args.insecure_ssl))
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, sort_keys=True), encoding="utf-8")
        print(f"Queried {min(start + len(batch), len(missing_ids)):,}/{len(missing_ids):,} IMDb IDs")
        time.sleep(args.sleep)

    oscar_count = 0
    festival_count = 0
    any_award_count = 0
    for movie in movies:
        award_names = sorted(cache.get(canonical_imdb_id(movie.get("imdbId")), []))
        oscar_winner, festival_winner = classify_awards(award_names)
        movie["awardNames"] = award_names
        movie["oscarWinner"] = oscar_winner
        movie["festivalWinner"] = festival_winner
        any_award_count += bool(award_names)
        oscar_count += oscar_winner
        festival_count += festival_winner

    MOVIES_PATH.write_text(json.dumps(movies, ensure_ascii=False), encoding="utf-8")
    print(
        f"Saved {any_award_count:,} movies with award data; "
        f"{oscar_count:,} Oscar winners; {festival_count:,} major-festival winners."
    )


if __name__ == "__main__":
    main()

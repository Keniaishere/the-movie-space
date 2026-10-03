from __future__ import annotations

import argparse
import csv
import gzip
import json
import time
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlencode

from download_movie_data import download_file
from fetch_posters import (
    POSTER_BASE_URL,
    get_tmdb_credentials,
    load_dotenv,
    request_json,
)


IMDB_DIR = Path("data/imdb")
MOVIES_PATH = Path("viz/movies_data.json")
MATCH_CACHE_PATH = Path("data/tmdb_imdb_match_cache.json")
YEARS = range(2018, 2026)


def ensure_imdb_files(overwrite: bool, insecure_ssl: bool) -> None:
    for filename in ("title.basics.tsv.gz", "title.ratings.tsv.gz"):
        download_file(
            f"https://datasets.imdbws.com/{filename}",
            IMDB_DIR / filename,
            overwrite=overwrite,
            insecure_ssl=insecure_ssl,
        )


def load_ratings() -> dict[str, tuple[float, int]]:
    ratings: dict[str, tuple[float, int]] = {}
    with gzip.open(IMDB_DIR / "title.ratings.tsv.gz", "rt", encoding="utf-8") as file:
        for row in csv.DictReader(file, delimiter="\t"):
            ratings[row["tconst"]] = (float(row["averageRating"]), int(row["numVotes"]))
    return ratings


def select_recent_movies(per_year: int) -> list[dict]:
    ratings = load_ratings()
    candidates: dict[int, list[dict]] = defaultdict(list)

    with gzip.open(IMDB_DIR / "title.basics.tsv.gz", "rt", encoding="utf-8") as file:
        for row in csv.DictReader(file, delimiter="\t"):
            if row["titleType"] != "movie" or row["startYear"] == "\\N":
                continue
            year = int(row["startYear"])
            if year not in YEARS or row["tconst"] not in ratings:
                continue
            rating, num_votes = ratings[row["tconst"]]
            candidates[year].append(
                {
                    "title": row["primaryTitle"],
                    "year": year,
                    "genres": row["genres"].replace(",", "|") if row["genres"] != "\\N" else "",
                    "imdbRating": round(rating, 1),
                    "numVotes": num_votes,
                    "imdbId": row["tconst"],
                }
            )

    selected = []
    for year in YEARS:
        selected.extend(sorted(candidates[year], key=lambda movie: movie["numVotes"], reverse=True)[:per_year])
    return selected


def add_tmdb_data(movies: list[dict], insecure_ssl: bool, sleep: float) -> None:
    load_dotenv(Path(".env"))
    api_key, bearer_token = get_tmdb_credentials()
    if not api_key and not bearer_token:
        raise SystemExit("Add TMDB_API_KEY or TMDB_BEARER_TOKEN to .env first.")

    cache = json.loads(MATCH_CACHE_PATH.read_text()) if MATCH_CACHE_PATH.exists() else {}
    query = {"external_source": "imdb_id", "language": "en-US"}
    if api_key and not bearer_token:
        query["api_key"] = api_key

    for index, movie in enumerate(movies, start=1):
        imdb_id = movie["imdbId"]
        if imdb_id not in cache:
            url = f"https://api.themoviedb.org/3/find/{imdb_id}?{urlencode(query)}"
            data = request_json(url, bearer_token, insecure_ssl) or {}
            result = (data.get("movie_results") or [None])[0]
            cache[imdb_id] = result
            time.sleep(sleep)

        match = cache.get(imdb_id)
        if match:
            movie["tmdbId"] = str(match["id"])
            if match.get("poster_path"):
                movie["posterUrl"] = f"{POSTER_BASE_URL}{match['poster_path']}"

        if index % 100 == 0:
            MATCH_CACHE_PATH.write_text(json.dumps(cache), encoding="utf-8")
            print(f"Matched {index:,}/{len(movies):,} movies with TMDB")

    MATCH_CACHE_PATH.write_text(json.dumps(cache), encoding="utf-8")


def merge_movies(recent_movies: list[dict]) -> None:
    existing = json.loads(MOVIES_PATH.read_text(encoding="utf-8"))
    # These years are fully managed by this updater. Replacing them also avoids
    # duplicates from legacy IMDb IDs that were stored without the `tt` prefix.
    existing = [movie for movie in existing if movie.get("year") not in YEARS]
    by_imdb_id = {movie.get("imdbId"): movie for movie in existing if movie.get("imdbId")}
    for movie in recent_movies:
        by_imdb_id[movie["imdbId"]] = movie

    without_imdb_id = [movie for movie in existing if not movie.get("imdbId")]
    merged = without_imdb_id + list(by_imdb_id.values())
    merged.sort(key=lambda movie: (movie["year"], movie["title"]))
    MOVIES_PATH.write_text(json.dumps(merged, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {len(merged):,} movies; newest year is {max(movie['year'] for movie in merged)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Add highly voted IMDb movies from 2018 through 2025.")
    parser.add_argument("--per-year", type=int, default=120)
    parser.add_argument("--overwrite-imdb", action="store_true")
    parser.add_argument("--insecure-ssl", action="store_true")
    parser.add_argument("--sleep", type=float, default=0.04)
    args = parser.parse_args()

    ensure_imdb_files(args.overwrite_imdb, args.insecure_ssl)
    movies = select_recent_movies(args.per_year)
    add_tmdb_data(movies, args.insecure_ssl, args.sleep)
    merge_movies(movies)


if __name__ == "__main__":
    main()

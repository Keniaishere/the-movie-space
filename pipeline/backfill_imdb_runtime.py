from __future__ import annotations

import csv
import gzip
import json
from pathlib import Path


MOVIES_PATH = Path("viz/movies_data.json")
IMDB_BASICS_PATH = Path("data/imdb/title.basics.tsv.gz")
IMDB_RATINGS_PATH = Path("data/imdb/title.ratings.tsv.gz")


def normalize_imdb_id(value: object) -> str:
    return str(value or "").removeprefix("tt").zfill(7)


def main() -> None:
    movies = json.loads(MOVIES_PATH.read_text(encoding="utf-8"))
    movies_by_imdb_id: dict[str, list[dict]] = {}
    for movie in movies:
        movies_by_imdb_id.setdefault(normalize_imdb_id(movie.get("imdbId")), []).append(movie)

    runtime_updated = 0
    with gzip.open(IMDB_BASICS_PATH, "rt", encoding="utf-8") as file:
        for row in csv.DictReader(file, delimiter="\t"):
            matching_movies = movies_by_imdb_id.get(normalize_imdb_id(row["tconst"]))
            if not matching_movies or row["runtimeMinutes"] == "\\N":
                continue
            runtime = int(row["runtimeMinutes"])
            for movie in matching_movies:
                movie["runtimeMinutes"] = runtime
                runtime_updated += 1

    rating_updated = 0
    with gzip.open(IMDB_RATINGS_PATH, "rt", encoding="utf-8") as file:
        for row in csv.DictReader(file, delimiter="\t"):
            matching_movies = movies_by_imdb_id.get(normalize_imdb_id(row["tconst"]))
            if not matching_movies:
                continue
            for movie in matching_movies:
                movie["imdbRating"] = round(float(row["averageRating"]), 1)
                movie["numVotes"] = int(row["numVotes"])
                rating_updated += 1

    MOVIES_PATH.write_text(json.dumps(movies, ensure_ascii=False), encoding="utf-8")
    missing = sum(not movie.get("runtimeMinutes") for movie in movies)
    print(
        f"Added IMDb runtime to {runtime_updated:,} movies; {missing} remain unknown. "
        f"Updated IMDb ratings and vote counts for {rating_updated:,} movies."
    )


if __name__ == "__main__":
    main()

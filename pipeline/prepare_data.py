from __future__ import annotations

import argparse
import csv
import gzip
import json
import re
from collections.abc import Iterable
from pathlib import Path
from typing import Any


DEFAULT_DATA_DIR = Path("data")
DEFAULT_IMDB_DIR = DEFAULT_DATA_DIR / "imdb"
DEFAULT_OUTPUT_PATH = Path("viz/movies_data.json")

TITLE_KEYS = ("title", "primaryTitle", "originalTitle", "name", "movieTitle")
YEAR_KEYS = ("year", "startYear", "releaseYear", "movieYear")
RATING_KEYS = ("imdbRating", "imdb_rating", "averageRating")
MISSING_VALUES = {"", "\\N", "N/A", "NA", "null", "None", "nan"}


def is_missing(value: Any) -> bool:
    return value is None or str(value).strip() in MISSING_VALUES


def clean_text(value: Any) -> str | None:
    if is_missing(value):
        return None

    text = str(value).strip()
    return text or None


def parse_number(value: Any) -> float | None:
    if is_missing(value):
        return None

    try:
        number = float(str(value).strip())
    except ValueError:
        return None

    return number


def parse_year(value: Any) -> int | None:
    if is_missing(value):
        return None

    match = re.search(r"\b(18\d{2}|19\d{2}|20\d{2})\b", str(value))
    if not match:
        return None

    return int(match.group(1))


def split_title_and_year(raw_title: Any) -> tuple[str | None, int | None]:
    title = clean_text(raw_title)
    if title is None:
        return None, None

    match = re.search(r"\s+\((18\d{2}|19\d{2}|20\d{2})\)\s*$", title)
    if not match:
        return title, None

    return title[: match.start()].strip(), int(match.group(1))


def first_present(record: dict[str, Any], keys: Iterable[str]) -> Any:
    for key in keys:
        if key in record and not is_missing(record[key]):
            return record[key]

    return None


def normalize_record(record: dict[str, Any]) -> dict[str, Any] | None:
    raw_title = first_present(record, TITLE_KEYS)
    title, title_year = split_title_and_year(raw_title)
    year = parse_year(first_present(record, YEAR_KEYS)) or title_year
    imdb_rating = parse_number(first_present(record, RATING_KEYS))

    if title is None or year is None or imdb_rating is None:
        return None

    if not 0 < imdb_rating <= 10:
        return None

    cleaned: dict[str, Any] = {
        "title": title,
        "year": year,
        "imdbRating": round(imdb_rating, 1),
    }

    optional_keys = {
        "movieId": ("movieId", "movie_id"),
        "imdbId": ("imdbId", "imdb_id", "tconst"),
        "tmdbId": ("tmdbId", "tmdb_id"),
        "genres": ("genres", "genre"),
        "numVotes": ("numVotes", "num_votes", "votes"),
        "posterUrl": ("posterUrl", "cover", "poster", "poster_url", "posterPath", "poster_path"),
    }

    for output_key, input_keys in optional_keys.items():
        value = first_present(record, input_keys)
        if not is_missing(value):
            cleaned[output_key] = value

    if "numVotes" in cleaned:
        number = parse_number(cleaned["numVotes"])
        if number is None:
            cleaned.pop("numVotes")
        else:
            cleaned["numVotes"] = int(number)

    return cleaned


def read_csv_records(path: Path) -> list[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        return [dict(row) for row in csv.DictReader(file)]


def read_tsv_gz_records(path: Path) -> list[dict[str, Any]]:
    with gzip.open(path, mode="rt", newline="", encoding="utf-8") as file:
        return [dict(row) for row in csv.DictReader(file, delimiter="\t")]


def walk_json_records(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json_records(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json_records(child)


def read_json_records(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as file:
        data = json.load(file)

    return list(walk_json_records(data))


def load_from_imdb(imdb_dir: Path) -> list[dict[str, Any]]:
    basics_path = imdb_dir / "title.basics.tsv.gz"
    ratings_path = imdb_dir / "title.ratings.tsv.gz"

    if not basics_path.exists() or not ratings_path.exists():
        return []

    ratings_by_id = {
        rating["tconst"]: rating
        for rating in read_tsv_gz_records(ratings_path)
        if not is_missing(rating.get("tconst")) and not is_missing(rating.get("averageRating"))
    }

    records: list[dict[str, Any]] = []
    for movie in read_tsv_gz_records(basics_path):
        if movie.get("titleType") != "movie":
            continue

        rating = ratings_by_id.get(movie.get("tconst", ""))
        if rating is None:
            continue

        normalized = normalize_record({**movie, **rating})
        if normalized is not None:
            records.append(normalized)

    return records


def load_from_data_files(data_dir: Path) -> list[dict[str, Any]]:
    if not data_dir.exists():
        return []

    records: list[dict[str, Any]] = []
    source_files = sorted(
        path
        for path in data_dir.rglob("*")
        if path.is_file()
        and path.suffix.lower() in {".csv", ".json"}
        and "imdb" not in path.relative_to(data_dir).parts
    )

    for path in source_files:
        try:
            raw_records = read_csv_records(path) if path.suffix.lower() == ".csv" else read_json_records(path)
        except (OSError, UnicodeDecodeError, csv.Error, json.JSONDecodeError) as error:
            print(f"Skipping {path}: {error}")
            continue

        for record in raw_records:
            normalized = normalize_record(record)
            if normalized is not None:
                records.append(normalized)

    return records


def dedupe_records(records: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: dict[tuple[Any, ...], dict[str, Any]] = {}

    for record in records:
        key = (
            record.get("imdbId") or record.get("movieId") or record["title"].casefold(),
            record["year"],
        )

        existing = deduped.get(key)
        if existing is None or record.get("numVotes", 0) > existing.get("numVotes", 0):
            deduped[key] = record

    return sorted(deduped.values(), key=lambda movie: (movie["year"], movie["title"]))


def save_json(records: list[dict[str, Any]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(records, file, ensure_ascii=False)

    print(f"Saved {len(records):,} movies to {output_path}")


def prepare_movies(data_dir: Path, imdb_dir: Path) -> list[dict[str, Any]]:
    records = [
        *load_from_imdb(imdb_dir),
        *load_from_data_files(data_dir),
    ]
    return dedupe_records(records)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare movie data for the visualization.")
    parser.add_argument(
        "--data-dir",
        default=str(DEFAULT_DATA_DIR),
        help=f"Folder to scan for CSV/JSON files. Default: {DEFAULT_DATA_DIR}",
    )
    parser.add_argument(
        "--imdb-dir",
        default=str(DEFAULT_IMDB_DIR),
        help=f"Folder containing IMDb title.basics.tsv.gz and title.ratings.tsv.gz. Default: {DEFAULT_IMDB_DIR}",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_PATH),
        help=f"Output JSON path. Default: {DEFAULT_OUTPUT_PATH}",
    )
    args = parser.parse_args()

    records = prepare_movies(Path(args.data_dir), Path(args.imdb_dir))
    if not records:
        raise SystemExit(
            "No usable movie records found. Expected records with title, year, and a numeric IMDb rating."
        )

    save_json(records, Path(args.output))


if __name__ == "__main__":
    main()

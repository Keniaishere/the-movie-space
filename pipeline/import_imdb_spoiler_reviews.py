from __future__ import annotations

import argparse
import hashlib
import json
import random
from pathlib import Path


MOVIES_PATH = Path("viz/movies_data.json")
SOURCE_PATH = Path("data/IMDB Spoiler Dataset/IMDB_reviews.json")
OUTPUT_PATH = Path("data/reviews/imdb_spoiler_reviews.json")
REPORT_PATH = Path("data/reviews/imdb_spoiler_coverage.json")


def load_json(path: Path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)


def normalized_imdb_id(value) -> str:
    identifier = str(value or "").strip()
    if not identifier:
        return ""
    if identifier.startswith("tt"):
        return identifier
    return f"tt{identifier.zfill(7)}"


def review_identifier(review: dict) -> str:
    identity = "\x1f".join(
        str(review.get(field) or "")
        for field in ("movie_id", "user_id", "review_date", "review_summary", "review_text")
    )
    return "imdb-spoiler-" + hashlib.sha256(identity.encode("utf-8")).hexdigest()[:24]


def compact_review(review: dict) -> dict:
    return {
        "id": review_identifier(review),
        "source": "imdb-spoiler-dataset",
        "author": str(review.get("user_id") or ""),
        "rating": review.get("rating"),
        "createdAt": str(review.get("review_date") or ""),
        "isSpoiler": bool(review.get("is_spoiler")),
        "summary": str(review.get("review_summary") or "").strip(),
        "content": str(review.get("review_text") or "").strip(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Match and deterministically sample the academic IMDb review corpus."
    )
    parser.add_argument("--movies", default=str(MOVIES_PATH))
    parser.add_argument("--source", default=str(SOURCE_PATH))
    parser.add_argument("--output", default=str(OUTPUT_PATH))
    parser.add_argument("--report", default=str(REPORT_PATH))
    parser.add_argument("--max-reviews-per-movie", type=int, default=100)
    args = parser.parse_args()

    movies: list[dict] = load_json(Path(args.movies), [])
    movie_by_imdb = {
        normalized_imdb_id(movie.get("imdbId")): movie
        for movie in movies
        if normalized_imdb_id(movie.get("imdbId"))
    }
    cap = max(1, args.max_reviews_per_movie)
    samples: dict[str, list[dict]] = {}
    seen_counts: dict[str, int] = {}
    duplicate_counts: dict[str, int] = {}
    content_hashes: dict[str, set[str]] = {}
    randomizers: dict[str, random.Random] = {}

    with Path(args.source).open(encoding="utf-8") as source:
        for line_number, line in enumerate(source, start=1):
            if not line.strip():
                continue
            review = json.loads(line)
            imdb_id = normalized_imdb_id(review.get("movie_id"))
            if imdb_id not in movie_by_imdb:
                continue
            content = str(review.get("review_text") or "").strip()
            if not content:
                continue

            content_hash = hashlib.sha256(" ".join(content.split()).lower().encode("utf-8")).hexdigest()
            movie_hashes = content_hashes.setdefault(imdb_id, set())
            if content_hash in movie_hashes:
                duplicate_counts[imdb_id] = duplicate_counts.get(imdb_id, 0) + 1
                continue
            movie_hashes.add(content_hash)

            seen_counts[imdb_id] = seen_counts.get(imdb_id, 0) + 1
            seen = seen_counts[imdb_id]
            movie_sample = samples.setdefault(imdb_id, [])
            compact = compact_review(review)
            if len(movie_sample) < cap:
                movie_sample.append(compact)
                continue

            if imdb_id not in randomizers:
                seed = int(hashlib.sha256(imdb_id.encode("utf-8")).hexdigest()[:16], 16)
                randomizers[imdb_id] = random.Random(seed)
            replacement_index = randomizers[imdb_id].randrange(seen)
            if replacement_index < cap:
                movie_sample[replacement_index] = compact

            if line_number % 100_000 == 0:
                print(f"Scanned {line_number:,} source reviews")

    records = {
        imdb_id: {
            "status": "sampled" if seen_counts[imdb_id] > len(samples[imdb_id]) else "complete",
            "totalResults": seen_counts[imdb_id],
            "sampledResults": len(samples[imdb_id]),
            "reviews": samples[imdb_id],
        }
        for imdb_id in sorted(samples)
    }
    rows = []
    for imdb_id, movie in movie_by_imdb.items():
        rows.append(
            {
                "imdbId": imdb_id,
                "title": movie.get("title"),
                "year": movie.get("year"),
                "availableReviewCount": seen_counts.get(imdb_id, 0),
                "sampledReviewCount": len(samples.get(imdb_id, [])),
                "duplicateReviewCount": duplicate_counts.get(imdb_id, 0),
            }
        )
    report = {
        "source": "Rishabh Misra IMDb Spoiler Dataset",
        "joinMethod": "Exact IMDb title ID (tconst)",
        "projectMovieCount": len(movies),
        "projectMovieIdCount": len(movie_by_imdb),
        "matchedMovieCount": len(records),
        "availableReviewCount": sum(seen_counts.values()),
        "sampledReviewCount": sum(len(value) for value in samples.values()),
        "maxReviewsPerMovie": cap,
        "movies": rows,
    }
    save_json(Path(args.output), records)
    save_json(Path(args.report), report)
    print(json.dumps({key: value for key, value in report.items() if key != "movies"}, indent=2))


if __name__ == "__main__":
    main()

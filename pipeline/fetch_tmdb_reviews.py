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
CACHE_PATH = Path("data/reviews/tmdb_reviews.json")
REPORT_PATH = Path("data/reviews/tmdb_review_coverage.json")


def create_ssl_context(insecure_ssl: bool) -> ssl.SSLContext:
    if insecure_ssl:
        return ssl._create_unverified_context()
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def request_page(
    tmdb_id: str,
    page: int,
    language: str,
    api_key: str | None,
    bearer_token: str | None,
    insecure_ssl: bool,
) -> dict | None:
    query: dict[str, str | int] = {"language": language, "page": page}
    if api_key and not bearer_token:
        query["api_key"] = api_key
    url = f"https://api.themoviedb.org/3/movie/{int(float(tmdb_id))}/reviews?{urlencode(query)}"
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
                return {"page": page, "results": [], "total_pages": 0, "total_results": 0}
            if error.code == 429:
                retry_after = float(error.headers.get("Retry-After", 1.5 * (attempt + 1)))
                time.sleep(retry_after)
                continue
            time.sleep(0.5 * (attempt + 1))
        except (TimeoutError, URLError, ConnectionError, OSError):
            time.sleep(0.5 * (attempt + 1))
    return None


def compact_review(review: dict) -> dict:
    author_details = review.get("author_details") or {}
    return {
        "id": review.get("id"),
        "author": review.get("author") or author_details.get("username") or "",
        "rating": author_details.get("rating"),
        "language": review.get("iso_639_1") or "",
        "createdAt": review.get("created_at") or "",
        "updatedAt": review.get("updated_at") or "",
        "url": review.get("url") or "",
        "content": (review.get("content") or "").strip(),
    }


def fetch_movie_reviews(
    tmdb_id: str,
    language: str,
    max_pages: int | None,
    api_key: str | None,
    bearer_token: str | None,
    insecure_ssl: bool,
) -> dict:
    first = request_page(tmdb_id, 1, language, api_key, bearer_token, insecure_ssl)
    if first is None:
        return {"status": "error", "totalResults": 0, "reviews": []}

    total_pages = int(first.get("total_pages") or 0)
    page_limit = total_pages if max_pages is None else min(total_pages, max_pages)
    raw_reviews = list(first.get("results") or [])
    for page in range(2, page_limit + 1):
        result = request_page(tmdb_id, page, language, api_key, bearer_token, insecure_ssl)
        if result is None:
            return {
                "status": "partial",
                "totalResults": int(first.get("total_results") or len(raw_reviews)),
                "reviews": [compact_review(review) for review in raw_reviews if review.get("content")],
            }
        raw_reviews.extend(result.get("results") or [])

    reviews = [compact_review(review) for review in raw_reviews if review.get("content")]
    return {
        "status": "complete" if page_limit >= total_pages else "limited",
        "totalResults": int(first.get("total_results") or len(reviews)),
        "reviews": reviews,
    }


def load_json(path: Path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)


def build_coverage_report(movies: list[dict], cache: dict[str, dict]) -> dict:
    movie_rows = []
    for movie in movies:
        tmdb_id = str(movie.get("tmdbId") or "")
        record = cache.get(tmdb_id, {})
        review_count = len(record.get("reviews") or [])
        movie_rows.append(
            {
                "imdbId": movie.get("imdbId"),
                "tmdbId": movie.get("tmdbId"),
                "title": movie.get("title"),
                "year": movie.get("year"),
                "reviewCount": review_count,
                "status": record.get("status", "not_fetched"),
            }
        )

    fetched_rows = [row for row in movie_rows if row["status"] != "not_fetched"]
    review_counts = [row["reviewCount"] for row in fetched_rows]
    return {
        "movieCount": len(movie_rows),
        "fetchedMovieCount": len(fetched_rows),
        "moviesWithReviews": sum(count > 0 for count in review_counts),
        "moviesWithAtLeast5Reviews": sum(count >= 5 for count in review_counts),
        "moviesWithAtLeast10Reviews": sum(count >= 10 for count in review_counts),
        "reviewCount": sum(review_counts),
        "failedMovieCount": sum(row["status"] in {"error", "partial"} for row in movie_rows),
        "movies": movie_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch TMDB reviews for the exact movies in viz/movies_data.json and report coverage."
    )
    parser.add_argument("--movies", default=str(MOVIES_PATH))
    parser.add_argument("--cache", default=str(CACHE_PATH))
    parser.add_argument("--report", default=str(REPORT_PATH))
    parser.add_argument("--language", default="en-US")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--limit", type=int, default=None, help="Limit uncached movies for a test run.")
    parser.add_argument("--max-pages", type=int, default=None, help="Limit pages fetched per movie.")
    parser.add_argument("--retry-errors", action="store_true")
    parser.add_argument("--insecure-ssl", action="store_true")
    args = parser.parse_args()

    load_dotenv(Path(".env"))
    api_key, bearer_token = get_tmdb_credentials()
    if not api_key and not bearer_token:
        raise SystemExit("Add TMDB_API_KEY or TMDB_BEARER_TOKEN to .env first.")

    movies_path = Path(args.movies)
    cache_path = Path(args.cache)
    report_path = Path(args.report)
    movies: list[dict] = load_json(movies_path, [])
    cache: dict[str, dict] = load_json(cache_path, {})

    tmdb_ids = list(dict.fromkeys(str(movie["tmdbId"]) for movie in movies if movie.get("tmdbId")))
    pending = [
        tmdb_id
        for tmdb_id in tmdb_ids
        if tmdb_id not in cache
        or (args.retry_errors and cache[tmdb_id].get("status") in {"error", "partial"})
    ]
    if args.limit is not None:
        pending = pending[: max(0, args.limit)]

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {
            executor.submit(
                fetch_movie_reviews,
                tmdb_id,
                args.language,
                args.max_pages,
                api_key,
                bearer_token,
                args.insecure_ssl,
            ): tmdb_id
            for tmdb_id in pending
        }
        for completed, future in enumerate(as_completed(futures), start=1):
            tmdb_id = futures[future]
            cache[tmdb_id] = future.result()
            if completed % 100 == 0:
                save_json(cache_path, cache)
                print(f"Fetched {completed:,}/{len(pending):,} uncached movies")

    save_json(cache_path, cache)
    report = build_coverage_report(movies, cache)
    save_json(report_path, report)
    print(
        f"Coverage: {report['moviesWithReviews']:,}/{report['fetchedMovieCount']:,} fetched movies "
        f"have reviews; {report['reviewCount']:,} review texts total; "
        f"{report['moviesWithAtLeast5Reviews']:,} movies have at least 5 reviews."
    )
    print(f"Cache: {cache_path}\nReport: {report_path}")


if __name__ == "__main__":
    main()

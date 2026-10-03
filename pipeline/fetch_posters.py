from __future__ import annotations

import argparse
import json
import os
import ssl
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


MOVIES_PATH = Path("viz/movies_data.json")
CACHE_PATH = Path("data/tmdb_poster_cache.json")
POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def get_tmdb_credentials() -> tuple[str | None, str | None]:
    api_key = os.getenv("TMDB_API_KEY")
    bearer_token = os.getenv("TMDB_BEARER_TOKEN")

    if bearer_token:
        bearer_token = bearer_token.removeprefix("Bearer ").strip()

    if api_key:
        api_key = api_key.strip()
        if api_key.startswith("eyJ") and not bearer_token:
            bearer_token = api_key
            api_key = None

    return api_key, bearer_token


def create_ssl_context(insecure_ssl: bool) -> ssl.SSLContext | None:
    if insecure_ssl:
        return ssl._create_unverified_context()

    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def request_json(url: str, bearer_token: str | None, insecure_ssl: bool) -> dict | None:
    headers = {"accept": "application/json"}
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"

    try:
        with urlopen(Request(url, headers=headers), timeout=20, context=create_ssl_context(insecure_ssl)) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        print(f"TMDB request failed with HTTP {error.code}: {url}")
    except (TimeoutError, URLError) as error:
        print(f"TMDB request failed: {error}")

    return None


def fetch_poster_url(
    tmdb_id: str,
    api_key: str | None,
    bearer_token: str | None,
    insecure_ssl: bool,
) -> str | None:
    query = {"language": "en-US"}
    if api_key and not bearer_token:
        query["api_key"] = api_key

    url = f"https://api.themoviedb.org/3/movie/{int(float(tmdb_id))}?{urlencode(query)}"
    data = request_json(url, bearer_token, insecure_ssl)
    poster_path = data.get("poster_path") if data else None
    return f"{POSTER_BASE_URL}{poster_path}" if poster_path else None


def load_cache(path: Path) -> dict[str, str | None]:
    if not path.exists():
        return {}

    return json.loads(path.read_text(encoding="utf-8"))


def save_cache(path: Path, cache: dict[str, str | None]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, indent=2, sort_keys=True), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch TMDB poster URLs for viz/movies_data.json.")
    parser.add_argument("--movies", default=str(MOVIES_PATH), help=f"Movie JSON path. Default: {MOVIES_PATH}")
    parser.add_argument("--cache", default=str(CACHE_PATH), help=f"Poster cache path. Default: {CACHE_PATH}")
    parser.add_argument("--limit", type=int, default=None, help="Limit new TMDB requests while testing.")
    parser.add_argument("--sleep", type=float, default=0.04, help="Delay between new TMDB requests. Default: 0.04")
    parser.add_argument("--insecure-ssl", action="store_true", help="Disable SSL verification if local certificates are broken.")
    args = parser.parse_args()

    load_dotenv(Path(".env"))
    load_dotenv(Path("/Users/ksenia/Downloads/data_ksenia/python_code/.env"))
    api_key, bearer_token = get_tmdb_credentials()
    if not api_key and not bearer_token:
        raise SystemExit(
            "No TMDB credentials found.\n"
            "Create .env in this project with either:\n"
            "  TMDB_API_KEY=your_api_key\n"
            "or:\n"
            "  TMDB_BEARER_TOKEN=your_bearer_token"
        )

    movies_path = Path(args.movies)
    cache_path = Path(args.cache)
    movies = json.loads(movies_path.read_text(encoding="utf-8"))
    cache = load_cache(cache_path)

    missing = [
        movie
        for movie in movies
        if movie.get("tmdbId") not in (None, "")
        and not movie.get("posterUrl")
    ]
    if args.limit:
        missing = missing[: args.limit]

    fetched = 0
    updated = 0
    for index, movie in enumerate(missing, start=1):
        tmdb_id = str(movie["tmdbId"])
        if tmdb_id not in cache or not cache.get(tmdb_id):
            cache[tmdb_id] = fetch_poster_url(tmdb_id, api_key, bearer_token, args.insecure_ssl)
            fetched += 1
            time.sleep(args.sleep)

        if cache.get(tmdb_id):
            movie["posterUrl"] = cache[tmdb_id]
            updated += 1

        if index % 100 == 0:
            save_cache(cache_path, cache)
            print(f"Checked {index:,}/{len(missing):,}; updated {updated:,}; fetched {fetched:,}.")

    save_cache(cache_path, cache)
    movies_path.write_text(json.dumps(movies, ensure_ascii=False), encoding="utf-8")
    print(f"Done. Added posterUrl to {updated:,} movies. New TMDB requests: {fetched:,}.")


if __name__ == "__main__":
    main()

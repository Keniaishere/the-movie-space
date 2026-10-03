from __future__ import annotations

import argparse
import json
import re
import ssl
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


MOVIES_PATH = Path("viz/movies_data.json")
CACHE_PATH = Path("data/oscar_winning_films_cache.json")
SOURCE_URL = "https://en.wikipedia.org/wiki/List_of_Academy_Award%E2%80%93winning_films"


class WikiTableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tables: list[list[list[str]]] = []
        self._table: list[list[str]] | None = None
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "table":
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in {"th", "td"} and self._row is not None:
            self._cell = []

    def handle_data(self, data: str) -> None:
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"th", "td"} and self._cell is not None and self._row is not None:
            self._row.append(" ".join("".join(self._cell).split()))
            self._cell = None
        elif tag == "tr" and self._row is not None and self._table is not None:
            if self._row:
                self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            self.tables.append(self._table)
            self._table = None


def create_ssl_context(insecure_ssl: bool) -> ssl.SSLContext:
    if insecure_ssl:
        return ssl._create_unverified_context()
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def display_title(value: object) -> str:
    title = str(value or "").strip()
    match = re.match(r"^(.*),\s+(The|A|An)$", title, flags=re.IGNORECASE)
    return f"{match.group(2)} {match.group(1)}" if match else title


def normalize_title(value: object) -> str:
    title = display_title(value)
    title = re.sub(r"\[[^]]*]", "", title)
    title = re.sub(r"\s*\([^)]*\)\s*$", "", title)
    title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    title = re.sub(r"[^a-z0-9]+", " ", title.casefold()).strip()
    return re.sub(r"^(the|a|an)\s+", "", title)


def parse_first_integer(value: object) -> int:
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else 0


def download_table(insecure_ssl: bool) -> list[dict]:
    request = Request(SOURCE_URL, headers={"User-Agent": "TheMovieSpaceSemesterProject/1.0"})
    with urlopen(request, timeout=60, context=create_ssl_context(insecure_ssl)) as response:
        html = response.read()

    parser = WikiTableParser()
    parser.feed(html.decode("utf-8"))
    table = next(candidate for candidate in parser.tables if candidate and candidate[0][:3] == ["Film", "Year", "Awards"])
    records = []
    for row in table[1:]:
        if len(row) < 3:
            continue
        year = parse_first_integer(row[1])
        wins = parse_first_integer(row[2])
        if year and wins:
            records.append({"title": row[0], "year": year, "wins": wins})
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Add film-level competitive Oscar win counts.")
    parser.add_argument("--insecure-ssl", action="store_true")
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()

    if CACHE_PATH.exists() and not args.refresh:
        oscar_records = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    else:
        oscar_records = download_table(args.insecure_ssl)
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(oscar_records, ensure_ascii=False, indent=2), encoding="utf-8")

    oscar_by_title_year = {
        (normalize_title(record["title"]), record["year"]): record["wins"]
        for record in oscar_records
    }
    movies = json.loads(MOVIES_PATH.read_text(encoding="utf-8"))
    matched = 0
    fallback = 0
    for movie in movies:
        key = (normalize_title(movie["title"]), int(movie["year"]))
        if key in oscar_by_title_year:
            movie["oscarWins"] = oscar_by_title_year[key]
            movie["oscarCountSource"] = "Wikipedia Academy Award-winning films list"
            matched += 1
        else:
            award_names = movie.get("awardNames", [])
            inferred = sum(
                "academy award" in name.casefold() or "oscar" in name.casefold()
                for name in award_names
            )
            movie["oscarWins"] = inferred
            movie["oscarCountSource"] = "Wikidata award categories" if inferred else None
            fallback += bool(inferred)
        movie["oscarWinner"] = movie["oscarWins"] > 0

    MOVIES_PATH.write_text(json.dumps(movies, ensure_ascii=False), encoding="utf-8")
    print(
        f"Added authoritative film-level counts to {matched:,} movies; "
        f"used Wikidata fallback for {fallback:,} movies."
    )


if __name__ == "__main__":
    main()

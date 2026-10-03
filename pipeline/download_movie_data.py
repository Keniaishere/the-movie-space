from __future__ import annotations

import argparse
import shutil
import ssl
import tarfile
import urllib.request
from pathlib import Path


DATA_DIR = Path("data")
IMDB_DIR = DATA_DIR / "imdb"
REVIEWS_DIR = DATA_DIR / "reviews"

IMDB_FILES = [
    "title.basics.tsv.gz",
    "title.ratings.tsv.gz",
    "title.crew.tsv.gz",
    "title.principals.tsv.gz",
    "name.basics.tsv.gz",
]

STANFORD_REVIEWS_URL = "https://ai.stanford.edu/~amaas/data/sentiment/aclImdb_v1.tar.gz"


def create_ssl_context(insecure_ssl: bool = False) -> ssl.SSLContext:
    if insecure_ssl:
        return ssl._create_unverified_context()

    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def download_file(url: str, destination: Path, overwrite: bool = False, insecure_ssl: bool = False) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)

    if destination.exists() and not overwrite:
        print(f"Already exists: {destination}")
        return

    print(f"Downloading: {url}")
    try:
        with urllib.request.urlopen(url, context=create_ssl_context(insecure_ssl)) as response:
            with destination.open("wb") as output:
                shutil.copyfileobj(response, output)
    except urllib.error.URLError as error:
        if "CERTIFICATE_VERIFY_FAILED" in str(error):
            print("\nSSL certificate verification failed.")
            print("Recommended fix: install certifi with: pip install certifi")
            print("Temporary fallback: run this script with: --insecure-ssl")
        raise

    print(f"Saved: {destination}")


def download_imdb_metadata(overwrite: bool = False, insecure_ssl: bool = False) -> None:
    base_url = "https://datasets.imdbws.com"

    for filename in IMDB_FILES:
        url = f"{base_url}/{filename}"
        destination = IMDB_DIR / filename
        download_file(url, destination, overwrite=overwrite, insecure_ssl=insecure_ssl)


def is_safe_tar_member(base_dir: Path, member: tarfile.TarInfo) -> bool:
    target_path = (base_dir / member.name).resolve()
    return target_path.is_relative_to(base_dir.resolve())


def extract_tar_gz(archive_path: Path, destination_dir: Path, overwrite: bool = False) -> None:
    extracted_folder = destination_dir / "aclImdb"

    if extracted_folder.exists() and not overwrite:
        print(f"Already extracted: {extracted_folder}")
        return

    destination_dir.mkdir(parents=True, exist_ok=True)
    print(f"Extracting: {archive_path}")

    with tarfile.open(archive_path, "r:gz") as tar:
        safe_members = [member for member in tar.getmembers() if is_safe_tar_member(destination_dir, member)]
        tar.extractall(destination_dir, members=safe_members)

    print(f"Extracted to: {extracted_folder}")


def download_stanford_reviews(overwrite: bool = False, insecure_ssl: bool = False) -> None:
    archive_path = REVIEWS_DIR / "aclImdb_v1.tar.gz"
    download_file(STANFORD_REVIEWS_URL, archive_path, overwrite=overwrite, insecure_ssl=insecure_ssl)
    extract_tar_gz(archive_path, REVIEWS_DIR, overwrite=overwrite)


def preview_with_pandas() -> None:
    try:
        import pandas as pd
    except ImportError:
        print("Pandas is not installed. Install it with: pip install pandas")
        return

    basics_path = IMDB_DIR / "title.basics.tsv.gz"
    ratings_path = IMDB_DIR / "title.ratings.tsv.gz"

    if not basics_path.exists() or not ratings_path.exists():
        print("IMDb files are missing. Run the script without --preview-only first.")
        return

    basics = pd.read_csv(basics_path, sep="\t", na_values="\\N", low_memory=False)
    ratings = pd.read_csv(ratings_path, sep="\t", na_values="\\N", low_memory=False)

    movies = basics[basics["titleType"] == "movie"].merge(ratings, on="tconst", how="left")
    movies = movies.rename(
        columns={
            "tconst": "imdb_id",
            "primaryTitle": "title",
            "startYear": "year",
            "averageRating": "imdb_rating",
            "numVotes": "num_votes",
        }
    )

    print("\nIMDb movie metadata preview:")
    print(movies[["imdb_id", "title", "year", "genres", "imdb_rating", "num_votes"]].head(10))

    reviews_root = REVIEWS_DIR / "aclImdb"
    if reviews_root.exists():
        print("\nStanford reviews dataset is ready at:")
        print(reviews_root)
    else:
        print("\nStanford reviews dataset was not extracted yet.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download free movie datasets for the visualization project.")
    parser.add_argument("--overwrite", action="store_true", help="Download and extract files again.")
    parser.add_argument("--metadata-only", action="store_true", help="Only download IMDb metadata.")
    parser.add_argument("--reviews-only", action="store_true", help="Only download Stanford IMDb reviews.")
    parser.add_argument("--preview-only", action="store_true", help="Only preview already downloaded data.")
    parser.add_argument("--no-preview", action="store_true", help="Skip pandas preview after downloading.")
    parser.add_argument(
        "--insecure-ssl",
        action="store_true",
        help="Disable SSL certificate verification if your local Python cannot find certificates.",
    )
    args = parser.parse_args()

    if args.preview_only:
        preview_with_pandas()
        return

    if args.metadata_only and args.reviews_only:
        parser.error("Use either --metadata-only or --reviews-only, not both.")

    if not args.reviews_only:
        download_imdb_metadata(overwrite=args.overwrite, insecure_ssl=args.insecure_ssl)

    if not args.metadata_only:
        download_stanford_reviews(overwrite=args.overwrite, insecure_ssl=args.insecure_ssl)

    if not args.no_preview:
        preview_with_pandas()


if __name__ == "__main__":
    main()

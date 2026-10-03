# Data-processing workflow

This folder contains the Python scripts used to prepare and enrich the movie data for The Movie Space.

## Data sources

- IMDb non-commercial datasets: titles, ratings, crew, principals, and names
- TMDB API: movie matching, posters, descriptions, credits, regions, keywords, and public reviews
- Rishabh Misra's academic IMDb Spoiler Dataset: audience review text
- Wikidata and the Academy Awards film table: award enrichment

Raw datasets, API caches, downloaded model weights, virtual environments, and API credentials are intentionally excluded from the website repository. They are large or private and can be recreated using these scripts.

## Approximate execution order

Run commands from the repository root. The scripts use paths such as `data/` and `viz/`, so either adapt those paths for this release folder or run the scripts in the original processing workspace.

1. `download_movie_data.py`
2. `prepare_data.py`
3. `update_recent_movies.py`
4. `fetch_posters.py`
5. `enrich_tmdb_movie_details.py`
6. `enrich_tmdb_regions.py`
7. `backfill_imdb_runtime.py`
8. `enrich_wikidata_awards.py`
9. `enrich_oscar_counts.py`
10. `fetch_tmdb_reviews.py`
11. `import_imdb_spoiler_reviews.py`
12. `analyze_review_emotions.py`

The final website consumes `movies_data.json` and `emotional_map_data.json`; it does not execute Python or the transformer model in the browser.

## Important provenance note

The recovered `analyze_review_emotions.py` is an earlier seven-emotion version using `j-hartmann/emotion-english-distilroberta-base`. The current `emotional_map_data.json` was generated later with `SamLowe/roberta-base-go_emotions`, all 28 sigmoid GoEmotions labels, and 12 overlapping cinematic lenses. The metadata embedded in `emotional_map_data.json` documents that final model, taxonomy, model revision, aggregation method, calibration formula, and pipeline fingerprint, but the final revised Python source file was not found.

Do not claim that the recovered analysis script directly generated the current final JSON. It documents the earlier workflow and was the predecessor of the final analysis pipeline.

## TMDB credentials

Copy `.env.example` to `.env` and insert your own TMDB credential. Never commit `.env`.

## Dependencies

Install the packages listed in `requirements.txt`. Python's standard library handles the remaining download and data-processing work.

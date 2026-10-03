from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path


MOVIES_PATH = Path("viz/movies_data.json")
REVIEWS_PATH = Path("data/reviews/tmdb_reviews.json")
IMDB_REVIEWS_PATH = Path("data/reviews/imdb_spoiler_reviews.json")
REVIEW_EMOTIONS_PATH = Path("data/reviews/tmdb_review_emotions.json")
OUTPUT_PATH = Path("viz/emotional_map_data.json")
MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"
LOCAL_MODEL_PATH = Path(
    "data/models/huggingface/hub/"
    "models--j-hartmann--emotion-english-distilroberta-base/"
    "snapshots/0e1cd914e3d46199ed785853e12b57304e04178b"
)
EMOTIONS = ("anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise")
ANCHORS = {
    "anger": (-0.88, 0.30),
    "disgust": (-0.74, -0.18),
    "fear": (-0.43, 0.82),
    "joy": (0.78, 0.40),
    "neutral": (0.00, -0.08),
    "sadness": (-0.34, -0.76),
    "surprise": (0.42, 0.84),
}
VALENCE_WEIGHTS = {
    "anger": -0.90,
    "disgust": -1.00,
    "fear": -0.72,
    "joy": 1.00,
    "neutral": 0.00,
    "sadness": -0.82,
    "surprise": 0.18,
}
AROUSAL_WEIGHTS = {
    "anger": 0.92,
    "disgust": 0.62,
    "fear": 0.90,
    "joy": 0.68,
    "neutral": 0.10,
    "sadness": 0.28,
    "surprise": 1.00,
}


def load_json(path: Path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value, *, pretty: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(value, ensure_ascii=False, indent=2 if pretty else None),
        encoding="utf-8",
    )
    temporary.replace(path)


def resolved_model_name(requested: str) -> str:
    if requested == MODEL_NAME and (LOCAL_MODEL_PATH / "config.json").exists():
        return str(LOCAL_MODEL_PATH)
    return requested


def stable_jitter(identifier: str) -> tuple[float, float]:
    digest = hashlib.sha256(identifier.encode("utf-8")).digest()
    angle = int.from_bytes(digest[:4], "big") / (2**32) * math.tau
    radius = 0.018 + int.from_bytes(digest[4:8], "big") / (2**32) * 0.055
    return math.cos(angle) * radius, math.sin(angle) * radius


def entropy(scores: dict[str, float]) -> float:
    emotional = [max(0.0, scores[name]) for name in EMOTIONS if name != "neutral"]
    total = sum(emotional)
    if total <= 0:
        return 0.0
    probabilities = [value / total for value in emotional if value > 0]
    value = -sum(probability * math.log(probability) for probability in probabilities)
    return value / math.log(len(EMOTIONS) - 1)


def confidence_tier(review_count: int) -> str:
    if review_count == 0:
        return "unclassified"
    if review_count < 5:
        return "low"
    if review_count < 10:
        return "medium"
    return "high"


def build_profile(
    movie: dict,
    review_scores: list[dict[str, float]],
    source_counts: dict[str, int] | None = None,
) -> dict:
    review_count = len(review_scores)
    if not review_scores:
        return {
            "imdbId": movie.get("imdbId"),
            "tmdbId": movie.get("tmdbId"),
            "reviewCount": 0,
            "reviewSources": {},
            "confidence": 0.0,
            "confidenceTier": "unclassified",
            "dominantEmotion": None,
            "emotionScores": None,
            "valence": None,
            "arousal": None,
            "complexity": None,
            "mapX": None,
            "mapY": None,
        }

    scores = {
        emotion: sum(review.get(emotion, 0.0) for review in review_scores) / review_count
        for emotion in EMOTIONS
    }
    dominant = max(EMOTIONS, key=scores.get)
    valence = sum(scores[name] * VALENCE_WEIGHTS[name] for name in EMOTIONS)
    arousal = sum(scores[name] * AROUSAL_WEIGHTS[name] for name in EMOTIONS)
    complexity = entropy(scores)
    sample_strength = min(1.0, math.log1p(review_count) / math.log(11))
    confidence = sample_strength * (0.55 + 0.45 * (1.0 - scores["neutral"]))

    map_x = sum(scores[name] * ANCHORS[name][0] for name in EMOTIONS)
    map_y = sum(scores[name] * ANCHORS[name][1] for name in EMOTIONS)
    jitter_x, jitter_y = stable_jitter(str(movie.get("imdbId") or movie.get("tmdbId")))
    map_x += jitter_x * (1.15 - confidence)
    map_y += jitter_y * (1.15 - confidence)

    return {
        "imdbId": movie.get("imdbId"),
        "tmdbId": movie.get("tmdbId"),
        "reviewCount": review_count,
        "reviewSources": source_counts or {},
        "confidence": round(confidence, 6),
        "confidenceTier": confidence_tier(review_count),
        "dominantEmotion": dominant,
        "emotionScores": {name: round(scores[name], 6) for name in EMOTIONS},
        "valence": round(valence, 6),
        "arousal": round(arousal, 6),
        "complexity": round(complexity, 6),
        "mapX": round(map_x, 6),
        "mapY": round(map_y, 6),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze all cached TMDB reviews and create Emotional Map profiles."
    )
    parser.add_argument("--movies", default=str(MOVIES_PATH))
    parser.add_argument("--reviews", default=str(REVIEWS_PATH))
    parser.add_argument("--imdb-reviews", default=str(IMDB_REVIEWS_PATH))
    parser.add_argument("--review-emotions", default=str(REVIEW_EMOTIONS_PATH))
    parser.add_argument("--output", default=str(OUTPUT_PATH))
    parser.add_argument("--model", default=MODEL_NAME)
    parser.add_argument("--batch-size", type=int, default=24)
    parser.add_argument("--max-chunks", type=int, default=4)
    parser.add_argument("--limit", type=int, default=None, help="Analyze only this many uncached reviews.")
    parser.add_argument("--rebuild", action="store_true")
    args = parser.parse_args()

    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except ImportError as error:
        raise SystemExit(
            "Install the analysis dependencies first: pip install torch transformers"
        ) from error

    movies: list[dict] = load_json(Path(args.movies), [])
    reviews_by_movie: dict[str, dict] = load_json(Path(args.reviews), {})
    imdb_reviews_by_movie: dict[str, dict] = load_json(Path(args.imdb_reviews), {})
    review_emotions_path = Path(args.review_emotions)
    cached: dict[str, dict] = {} if args.rebuild else load_json(review_emotions_path, {})

    review_lookup: dict[str, str] = {}
    for movie_record in reviews_by_movie.values():
        for review in movie_record.get("reviews") or []:
            review_id = str(review.get("id") or "")
            content = (review.get("content") or "").strip()
            if review_id and content:
                review_lookup[review_id] = content
    for movie_record in imdb_reviews_by_movie.values():
        for review in movie_record.get("reviews") or []:
            review_id = str(review.get("id") or "")
            content = (review.get("content") or "").strip()
            if review_id and content:
                review_lookup[review_id] = content

    pending = [(review_id, text) for review_id, text in review_lookup.items() if review_id not in cached]
    if args.limit is not None:
        pending = pending[: max(0, args.limit)]

    model_name = resolved_model_name(args.model)
    print(f"Loading model {model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)
    model.eval()
    labels = {int(index): str(label).lower() for index, label in model.config.id2label.items()}
    max_tokens = min(int(getattr(tokenizer, "model_max_length", 512)), 512) - 2
    print(f"Analyzing {len(pending):,} uncached reviews on {device.type}...")

    for start in range(0, len(pending), args.batch_size):
        review_batch = pending[start : start + args.batch_size]
        chunks: list[str] = []
        owners: list[str] = []
        for review_id, text in review_batch:
            token_ids = tokenizer.encode(text, add_special_tokens=False, verbose=False)
            review_chunks = [token_ids[index : index + max_tokens] for index in range(0, len(token_ids), max_tokens)]
            for token_chunk in review_chunks[: max(1, args.max_chunks)]:
                chunks.append(tokenizer.decode(token_chunk, skip_special_tokens=True))
                owners.append(review_id)

        encoded = tokenizer(
            chunks,
            padding=True,
            truncation=True,
            max_length=max_tokens + 2,
            return_tensors="pt",
        )
        encoded = {name: value.to(device) for name, value in encoded.items()}
        with torch.inference_mode():
            probabilities = torch.softmax(model(**encoded).logits, dim=-1).cpu().tolist()

        grouped: dict[str, list[list[float]]] = {}
        for review_id, probability in zip(owners, probabilities):
            grouped.setdefault(review_id, []).append(probability)
        for review_id, vectors in grouped.items():
            averaged = [sum(vector[index] for vector in vectors) / len(vectors) for index in range(len(vectors[0]))]
            cached[review_id] = {
                labels[index]: round(float(value), 7)
                for index, value in enumerate(averaged)
                if labels.get(index) in EMOTIONS
            }

        completed = min(start + args.batch_size, len(pending))
        if completed % 240 == 0 or completed == len(pending):
            save_json(review_emotions_path, cached)
            print(f"Analyzed {completed:,}/{len(pending):,} reviews")

    save_json(review_emotions_path, cached)

    profiles = []
    for movie in movies:
        tmdb_id = str(movie.get("tmdbId") or "")
        imdb_id = str(movie.get("imdbId") or "")
        if imdb_id and not imdb_id.startswith("tt"):
            imdb_id = f"tt{imdb_id.zfill(7)}"
        tmdb_reviews = reviews_by_movie.get(tmdb_id, {}).get("reviews") or []
        imdb_reviews = imdb_reviews_by_movie.get(imdb_id, {}).get("reviews") or []
        source_counts = {
            "tmdb": sum(str(review.get("id")) in cached for review in tmdb_reviews),
            "imdbAcademic": sum(str(review.get("id")) in cached for review in imdb_reviews),
        }
        source_counts = {name: count for name, count in source_counts.items() if count}
        movie_reviews = [*tmdb_reviews, *imdb_reviews]
        scores = [cached[str(review.get("id"))] for review in movie_reviews if str(review.get("id")) in cached]
        profiles.append(build_profile(movie, scores, source_counts))

    summary = {
        "movieCount": len(profiles),
        "classifiedMovieCount": sum(profile["reviewCount"] > 0 for profile in profiles),
        "unclassifiedMovieCount": sum(profile["reviewCount"] == 0 for profile in profiles),
        "reviewCount": sum(profile["reviewCount"] for profile in profiles),
        "confidenceTiers": {
            tier: sum(profile["confidenceTier"] == tier for profile in profiles)
            for tier in ("unclassified", "low", "medium", "high")
        },
    }
    output = {
        "model": args.model,
        "method": "Exact-ID joined TMDB and academic IMDb reviews. Equal-weight mean of per-review transformer scores; reviews chunked to model context.",
        "emotions": list(EMOTIONS),
        "anchors": {name: list(position) for name, position in ANCHORS.items()},
        "summary": summary,
        "movies": profiles,
    }
    save_json(Path(args.output), output)
    print(json.dumps(summary, indent=2))
    print(f"Saved Emotional Map data: {args.output}")


if __name__ == "__main__":
    main()

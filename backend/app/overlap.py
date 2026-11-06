"""Placeholder pairwise community-overlap engine.

Mirrors scoring.py: fake but deterministic, so the frontend's 3D bubble
layout has real numbers to lay out against today, before the real
methodology exists.

Replace `calculate_overlap` with the real thing later — e.g. Jaccard
similarity of active users between two subreddits, shared commenters, or
cross-posting rate. The signature is the contract the layout solver
(frontend/src/three/layout.js) relies on.
"""
import hashlib

def calculate_overlap(subreddit_a: str, subreddit_b: str) -> float:
    """TODO(overlap): replace with real methodology.

    Output: float in [0, 1] — 0 means no meaningful shared audience, 1 means
    effectively the same audience.

    Current behavior: deterministic pseudo-random value derived from the
    (order-independent) pair of subreddit names, skewed toward low overlap
    so most pairs are unrelated and a few stand out. NOT a real signal.
    """
    pair_key = "|".join(sorted((subreddit_a.lower(), subreddit_b.lower())))
    digest = hashlib.sha256(pair_key.encode()).hexdigest()
    raw = int(digest[:8], 16) / 0xFFFFFFFF
    return round(raw**2.2, 3)

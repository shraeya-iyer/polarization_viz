"""Placeholder echo-chamber / epistemic-bubble scoring engine.

This module is intentionally fake. It exists so the frontend has
realistic-looking data to render before the real methodology is ready.

Replace `calculate_bubble_score` with the real implementation — its
signature is the contract the rest of the app (communities.py, and the
frontend's risk badges) relies on. Nothing else needs to change.
"""
import hashlib

RISK_LOW = "low"
RISK_MEDIUM = "medium"
RISK_HIGH = "high"


def calculate_bubble_score(subreddit: dict) -> dict:
    """TODO(scoring): replace with the real methodology.

    Input: subreddit metadata dict from
        reddit_client.get_subscribed_subreddits (and, later, whatever
        activity-history data the real methodology needs).
    Output: {"score": float in [0, 1], "risk_level": "low" | "medium" | "high"}

    Current behavior is a deterministic pseudo-random score derived from the
    subreddit name — purely so the UI has a realistic mix of risk levels to
    render. It is NOT a real signal of anything.
    """
    digest = hashlib.sha256(subreddit["display_name"].encode()).hexdigest()
    score = int(digest[:8], 16) / 0xFFFFFFFF

    if score < 0.4:
        risk_level = RISK_LOW
    elif score < 0.75:
        risk_level = RISK_MEDIUM
    else:
        risk_level = RISK_HIGH

    return {"score": round(score, 3), "risk_level": risk_level}

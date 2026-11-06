"""Placeholder article sourcing.

Two things this module owes the rest of the app, both currently stubbed:

1. A general "how echo chambers work" explainer, shown once at the top of
   the dashboard. Configure it via GENERAL_ARTICLE_TITLE / GENERAL_ARTICLE_URL
   in .env — no code change needed once you have the link.
2. Two "other side" articles per medium/high-risk community.
   TODO(articles): replace with real sourcing (curated set, search, or
   whatever the scoring methodology feeds it) once bubble detection can
   identify each community's dominant viewpoint.
"""
from .config import settings


def get_general_article() -> dict | None:
    if not settings.general_article_url:
        return None
    return {
        "title": settings.general_article_title or "How echo chambers work, and why they're harmful",
        "url": settings.general_article_url,
    }


def get_opposing_view_articles(subreddit_display_name: str) -> list[dict]:
    # TODO(articles): replace with real sourcing tied to the scoring methodology.
    return [
        {
            "title": f"[Placeholder] Opposing-view article #1 for r/{subreddit_display_name}",
            "url": None,
        },
        {
            "title": f"[Placeholder] Opposing-view article #2 for r/{subreddit_display_name}",
            "url": None,
        },
    ]

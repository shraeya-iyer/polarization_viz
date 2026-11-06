from itertools import combinations

from fastapi import APIRouter, Depends

from . import reddit_client
from .articles import get_general_article, get_opposing_view_articles
from .auth import get_current_session
from .overlap import calculate_overlap
from .scoring import calculate_bubble_score

router = APIRouter(prefix="/api", tags=["communities"])

# Below this, a pair is treated as "no meaningful overlap" and left out of
# the response so the payload doesn't grow O(n^2) with noise.
OVERLAP_THRESHOLD = 0.05


@router.get("/me")
async def me(session: dict = Depends(get_current_session)):
    return {"reddit_username": session["reddit_username"]}


@router.get("/general-article")
def general_article():
    return get_general_article()


def _summarize(communities: list[dict]) -> dict:
    counts = {"low": 0, "medium": 0, "high": 0}
    for c in communities:
        counts[c["risk_level"]] += 1
    average_score = round(sum(c["score"] for c in communities) / len(communities), 3) if communities else 0.0
    return {"total": len(communities), "counts": counts, "average_score": average_score}


@router.get("/communities")
async def list_communities(session: dict = Depends(get_current_session)):
    subreddits = await reddit_client.get_subscribed_subreddits(session["access_token"])

    communities = []
    for sr in subreddits:
        bubble = calculate_bubble_score(sr)
        opposing_articles = (
            get_opposing_view_articles(sr["display_name"])
            if bubble["risk_level"] in ("medium", "high")
            else []
        )
        communities.append({**sr, **bubble, "opposing_articles": opposing_articles})

    overlaps = []
    for a, b in combinations(communities, 2):
        overlap = calculate_overlap(a["display_name"], b["display_name"])
        if overlap >= OVERLAP_THRESHOLD:
            overlaps.append({"a": a["id"], "b": b["id"], "overlap": overlap})

    return {
        "communities": communities,
        "overlaps": overlaps,
        "summary": _summarize(communities),
    }

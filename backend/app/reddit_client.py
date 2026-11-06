"""Thin wrapper around Reddit's OAuth + REST API.

Docs: https://github.com/reddit-archive/reddit/wiki/OAuth2
Reddit requires every request to carry a descriptive User-Agent
(REDDIT_USER_AGENT) or it will silently rate-limit/block the app.
"""
import httpx

from .config import settings

REDDIT_AUTH_URL = "https://www.reddit.com/api/v1/authorize"
REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
REDDIT_API_BASE = "https://oauth.reddit.com"


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": settings.reddit_client_id,
        "response_type": "code",
        "state": state,
        "redirect_uri": settings.reddit_redirect_uri,
        # "permanent" issues a refresh_token so the session survives past
        # the ~1hr access token lifetime without re-prompting the user.
        "duration": "permanent",
        "scope": settings.reddit_scopes,
    }
    return str(httpx.URL(REDDIT_AUTH_URL, params=params))


async def exchange_code_for_token(code: str) -> dict:
    auth = (settings.reddit_client_id, settings.reddit_client_secret)
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.reddit_redirect_uri,
    }
    headers = {"User-Agent": settings.reddit_user_agent}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(REDDIT_TOKEN_URL, data=data, auth=auth, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def refresh_access_token(refresh_token: str) -> dict:
    auth = (settings.reddit_client_id, settings.reddit_client_secret)
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    headers = {"User-Agent": settings.reddit_user_agent}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(REDDIT_TOKEN_URL, data=data, auth=auth, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def get_identity(access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}", "User-Agent": settings.reddit_user_agent}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{REDDIT_API_BASE}/api/v1/me", headers=headers)
        resp.raise_for_status()
        return resp.json()


async def get_subscribed_subreddits(access_token: str, limit: int = 100) -> list[dict]:
    """Communities the user is subscribed to — the v1 proxy for
    'communities they're involved in'. Paginates until exhausted or `limit`
    is reached.
    """
    headers = {"Authorization": f"Bearer {access_token}", "User-Agent": settings.reddit_user_agent}
    subreddits: list[dict] = []
    after: str | None = None
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            params = {"limit": 100}
            if after:
                params["after"] = after
            resp = await client.get(
                f"{REDDIT_API_BASE}/subreddits/mine/subscriber", headers=headers, params=params
            )
            resp.raise_for_status()
            payload = resp.json()["data"]
            for child in payload["children"]:
                d = child["data"]
                subreddits.append(
                    {
                        "id": d["name"],  # Reddit "fullname", e.g. t5_xxxxx
                        "display_name": d["display_name"],
                        "subscribers": d.get("subscribers"),
                        "public_description": d.get("public_description"),
                        "url": f"https://reddit.com{d['url']}",
                    }
                )
                if len(subreddits) >= limit:
                    return subreddits
            after = payload.get("after")
            if not after:
                break
    return subreddits

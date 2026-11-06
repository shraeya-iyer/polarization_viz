"""Reddit OAuth 2.0 flow.

Flow: /auth/reddit/login redirects to Reddit's consent screen with a random
CSRF `state`. Reddit redirects back to /auth/reddit/callback with a `code`;
we exchange it for tokens, fetch the user's identity, and open a session
tied to an HttpOnly cookie (the frontend never sees the Reddit tokens).
"""
import time
import secrets

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from . import reddit_client, session_store
from .config import settings

router = APIRouter(prefix="/auth/reddit", tags=["auth"])

SESSION_COOKIE = "pop_session"
_STATE_TTL_SECONDS = 600

# In-memory CSRF state store. Fine for a single-process prototype; states
# live only for the few seconds of the redirect round-trip.
_pending_states: dict[str, float] = {}


def _cleanup_states() -> None:
    now = time.time()
    for s, ts in list(_pending_states.items()):
        if now - ts > _STATE_TTL_SECONDS:
            _pending_states.pop(s, None)


@router.get("/login")
def login():
    _cleanup_states()
    state = secrets.token_urlsafe(24)
    _pending_states[state] = time.time()
    return RedirectResponse(reddit_client.build_authorize_url(state))


@router.get("/callback")
async def callback(code: str | None = None, state: str | None = None, error: str | None = None):
    if error:
        # e.g. user clicked "decline" on Reddit's consent screen
        return RedirectResponse(f"{settings.frontend_url}/?auth_error={error}")

    if not state or state not in _pending_states:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")
    _pending_states.pop(state, None)

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    token_data = await reddit_client.exchange_code_for_token(code)
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)

    identity = await reddit_client.get_identity(access_token)
    reddit_username = identity.get("name", "")

    session_id = session_store.create_session(reddit_username, access_token, refresh_token, expires_in)

    redirect = RedirectResponse(f"{settings.frontend_url}/dashboard")
    redirect.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/",
    )
    return redirect


@router.post("/logout")
def logout(request: Request, response: Response):
    session_id = request.cookies.get(SESSION_COOKIE)
    if session_id:
        session_store.delete_session(session_id)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


async def get_current_session(request: Request) -> dict:
    """FastAPI dependency: resolves the caller's session, transparently
    refreshing the Reddit access token if it's about to expire.
    """
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    if session["expires_at"] < time.time() + 30:
        if not session["refresh_token"]:
            raise HTTPException(status_code=401, detail="Session expired, please reconnect")
        refreshed = await reddit_client.refresh_access_token(session["refresh_token"])
        session_store.update_access_token(
            session_id, refreshed["access_token"], refreshed.get("expires_in", 3600)
        )
        session["access_token"] = refreshed["access_token"]

    return session

# Pop

Connects to your Reddit account, lists the communities you're subscribed to, and
(eventually) flags the ones where you're likely in an epistemic bubble/echo
chamber — with links to the other side of the argument for anything flagged
medium/high risk, and a general explainer at the top of the dashboard.

**Current status: v1 scaffold.** Reddit OAuth, session handling, and the
subscribed-communities fetch are real and working. The *scoring* (what makes a
community "risky") and the *opposing-article sourcing* are placeholders —
clearly marked `TODO` in the code — waiting on the methodology described
separately.

## Architecture

```
backend/   FastAPI — Reddit OAuth, session cookies, /api/communities
frontend/  React (Vite) + react-three-fiber — Landing (floating bubbles) +
           Dashboard (3D bubble cluster, click a bubble to inspect it)
```

The dashboard renders each community as a soap bubble (three.js
`meshPhysicalMaterial` with real `iridescence` + `transmission` — physically
based thin-film shine, not a faked gradient) positioned around a central
summary bubble. Distance between two community bubbles is driven by
`backend/app/overlap.py`'s pairwise overlap score — see the placeholder note
below — via a spring-relaxation layout in `frontend/src/three/layout.js`.
Bubble reflections come from an HDRI loaded through drei's `<Environment>`,
which fetches from a CDN at runtime, so the dashboard needs normal internet
access in the browser (not just for the Reddit API calls).

- **Auth**: standard OAuth 2.0 authorization-code flow against Reddit. The
  frontend never sees Reddit's access/refresh tokens — they're stored
  server-side (SQLite, encrypted at rest with Fernet) behind an opaque,
  HttpOnly session cookie.
- **Data**: `GET /api/communities` returns the user's subscribed subreddits,
  each with a `score`/`risk_level` (from `backend/app/scoring.py`) and, for
  medium/high risk, two `opposing_articles` (from `backend/app/articles.py`).
- **Placeholders**: `scoring.py::calculate_bubble_score`,
  `articles.py::get_opposing_view_articles`, and now
  `overlap.py::calculate_overlap` (pairwise community overlap, which drives
  how close/intersecting two bubbles sit in the 3D layout) are the functions
  to replace. Their input/output contract is documented in their
  docstrings — nothing else in the app needs to change when you swap them
  out.

## Setup

### 1. Register a Reddit app

Go to https://www.reddit.com/prefs/apps → "create another app" → type
**web app** → redirect URI `http://localhost:8000/auth/reddit/callback`.
Note the client ID (under the app name) and client secret.

Reddit's API requires a descriptive User-Agent on every request — use
something like `pop-app/0.1 (by /u/your_username)`.

### 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# fill in REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
# generate SESSION_SECRET_KEY with:
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# optionally set GENERAL_ARTICLE_TITLE / GENERAL_ARTICLE_URL

uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # only needed if the API isn't on localhost:8000
npm run dev
```

Open http://localhost:5173, click **Connect Reddit**.

## Security notes

- Tokens are encrypted at rest (`SESSION_SECRET_KEY`, a Fernet key) — losing
  the SQLite file alone doesn't leak sessions.
- Session cookie is `HttpOnly` + `SameSite=Lax`; `Secure` turns on
  automatically when `ENVIRONMENT=production`.
- OAuth `state` is a random token checked on callback (CSRF protection),
  single-use, short TTL.
- CORS is locked to `FRONTEND_URL` with `allow_credentials=True`.
- Requested Reddit scopes are minimal (`identity`, `mysubreddits`) — expand
  in `.env` (`REDDIT_SCOPES`) only as the real scoring methodology needs more
  (e.g. comment/post history).

Before adding more platforms (X/Twitter, etc.), check that platform's
developer terms — several restrict apps that profile/score users based on
inferred beliefs, which is close to what this does.

## What's next (not yet built)

- Real scoring methodology (`backend/app/scoring.py`)
- Real opposing-article sourcing (`backend/app/articles.py`)
- Per-community activity fetch beyond subscription list (comments/posts), if
  the scoring methodology needs it — `reddit_client.py` is the place to add it
- Persisting results so the dashboard doesn't refetch/recompute every load

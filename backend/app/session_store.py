"""SQLite-backed session store. Access/refresh tokens are encrypted at rest
with Fernet (symmetric encryption) — the DB file alone is not enough to use
a stolen session; SESSION_SECRET_KEY is also required.
"""
import sqlite3
import secrets
import time
from pathlib import Path

from cryptography.fernet import Fernet

from .config import settings

DB_PATH = Path(__file__).resolve().parent.parent / "pop.db"
_fernet = Fernet(settings.session_secret_key.encode())


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            reddit_username TEXT,
            access_token BLOB NOT NULL,
            refresh_token BLOB,
            expires_at REAL NOT NULL,
            created_at REAL NOT NULL
        )
        """
    )
    return conn


def create_session(reddit_username: str, access_token: str, refresh_token: str | None, expires_in: int) -> str:
    session_id = secrets.token_urlsafe(32)
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO sessions (session_id, reddit_username, access_token, refresh_token, expires_at, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (
                session_id,
                reddit_username,
                _fernet.encrypt(access_token.encode()),
                _fernet.encrypt(refresh_token.encode()) if refresh_token else None,
                time.time() + expires_in,
                time.time(),
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return session_id


def get_session(session_id: str) -> dict | None:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT reddit_username, access_token, refresh_token, expires_at FROM sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()
    finally:
        conn.close()
    if not row:
        return None
    username, enc_access, enc_refresh, expires_at = row
    return {
        "reddit_username": username,
        "access_token": _fernet.decrypt(enc_access).decode(),
        "refresh_token": _fernet.decrypt(enc_refresh).decode() if enc_refresh else None,
        "expires_at": expires_at,
    }


def update_access_token(session_id: str, access_token: str, expires_in: int) -> None:
    conn = _get_conn()
    try:
        conn.execute(
            "UPDATE sessions SET access_token = ?, expires_at = ? WHERE session_id = ?",
            (_fernet.encrypt(access_token.encode()), time.time() + expires_in, session_id),
        )
        conn.commit()
    finally:
        conn.close()


def delete_session(session_id: str) -> None:
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        conn.commit()
    finally:
        conn.close()

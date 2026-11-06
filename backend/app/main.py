from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import auth, communities
from .config import settings

app = FastAPI(title="Pop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(communities.router)


@app.get("/health")
def health():
    return {"ok": True}

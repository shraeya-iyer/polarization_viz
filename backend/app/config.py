from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    reddit_client_id: str
    reddit_client_secret: str
    reddit_redirect_uri: str = "http://localhost:8000/auth/reddit/callback"
    reddit_user_agent: str = "pop-app/0.1 (by /u/change_me)"
    reddit_scopes: str = "identity mysubreddits"

    frontend_url: str = "http://localhost:5173"
    environment: str = "development"

    # Fernet key used to encrypt OAuth tokens at rest. Generate with:
    # python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    session_secret_key: str

    general_article_title: str | None = None
    general_article_url: str | None = None


settings = Settings()

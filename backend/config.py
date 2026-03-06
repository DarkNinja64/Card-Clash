from pydantic_settings import BaseSettings


# BaseSettings reads values from .env automatically and validates their types
# any missing required field will blow up at startup rather than failing silently later
class Settings(BaseSettings):
    database_url: str           # SQLAlchemy connection string — prefix tells it which driver to use
    redis_url: str              # reserved for socket.io scaling, not actively wired up yet
    jwt_secret: str             # signs and verifies all tokens — must be secret and random in prod
    jwt_algorithm: str = "HS256"        # symmetric signing, one secret for both sign and verify
    jwt_expire_minutes: int = 480       # 8 hours — lenght of average school day
    frontend_origin: str = "http://localhost:3000"  # must exactly match the next.js URL for CORS

    class Config:
        env_file = ".env"


# module-level singleton — import this anywhere in the app to access config
settings = Settings()

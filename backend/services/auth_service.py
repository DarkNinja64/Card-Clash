import base64
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
from jose import JWTError, jwt

from config import settings

# keyed by kid so we can look up the right public key without re-fetching on every request
_jwks_cache: dict[str, dict] = {}


def hash_password(password: str) -> str:
    # gensalt() generates a new random salt every call so two identical passwords get different hashes
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    # checkpw does a constant-time comparison to prevent timing attacks
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict) -> str:
    # used for student join tokens only — teachers get tokens from Supabase, not here
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload["exp"] = expire
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    # decodes backend-issued student tokens (signed with jwt_secret)
    # returns {} on any failure so callers just do `if not payload`
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return {}


async def warm_jwks_cache() -> None:
    """Fetch Supabase public keys once at startup and cache them.

    Supabase newer projects use ES256 (asymmetric). We pre-fetch the JWKS so
    on_connect never has to make a blocking HTTP call while handling sockets.
    Falls back gracefully — HS256 projects don't use the JWKS at all.
    """
    if not settings.supabase_url:
        print("[auth] No SUPABASE_URL — skipping JWKS warm")
        return
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/.well-known/jwks.json",
                timeout=10,
            )
            resp.raise_for_status()
            keys = resp.json().get("keys", [])
            for key in keys:
                _jwks_cache[key["kid"]] = key
            print(f"[auth] JWKS cache warmed — {len(keys)} key(s): {list(_jwks_cache.keys())}")
    except Exception as e:
        print(f"[auth] JWKS warm failed (HS256 fallback will be used): {e}")


async def refresh_jwks_cache() -> None:
    """Force a JWKS re-fetch — call this if Supabase rotates its signing keys."""
    _jwks_cache.clear()
    await warm_jwks_cache()


def decode_supabase_token(token: str) -> dict:
    """Decode and verify a Supabase-issued JWT.

    Supports both ES256 (newer Supabase projects, key from JWKS cache) and
    HS256 (older projects, key from SUPABASE_JWT_SECRET env var).
    Returns {} on any failure — callers do `if not payload` to check.
    """
    if not token:
        return {}
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            kid = header.get("kid", "")
            key = _jwks_cache.get(kid)
            if not key:
                # Key not in cache — could be a rotation. Log clearly so it's obvious.
                print(f"[auth] ES256 kid={kid!r} not in JWKS cache. "
                      f"Cached kids: {list(_jwks_cache.keys())}. "
                      "Call /auth/refresh-jwks if Supabase rotated keys.")
                return {}
            return jwt.decode(token, key, algorithms=["ES256"], audience="authenticated")

        else:
            # HS256 — older Supabase projects sign with the raw bytes of the secret.
            # The dashboard shows it as base64; decode to bytes before verifying.
            secret = base64.b64decode(settings.supabase_jwt_secret)
            return jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")

    except JWTError as e:
        print(f"[auth] Supabase JWT decode failed: {e}")
        return {}
    except Exception as e:
        print(f"[auth] Unexpected error decoding token: {e}")
        return {}

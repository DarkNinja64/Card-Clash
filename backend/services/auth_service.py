import base64
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
from jose import JWTError, jwt

from config import settings

# keyed by kid so we can look up the right public key without re-fetching on every request
_jwks_cache: dict[str, dict] = {}

# using bcrypt directly instead of passlib

def hash_password(password: str) -> str:
    # gensalt() generates a new random salt every call so two identical passwords get different hashes
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    # checkpw does a constant-time comparison to prevent timing attacks
    # (an attacker can't tell if a password is "almost right" by measuring response time)
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict) -> str:
    # used for student join tokens only — teachers get tokens from Supabase, not here
    # copy the dict so we don't mutate whatever the caller passed in
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload["exp"] = expire  # exp is the standard JWT expiry claim, jose validates this automatically
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    # decodes backend-issued student tokens (signed with jwt_secret)
    # returns {} on any failure — expired, bad signature, totally malformed, whatever
    # callers just do `if not payload` rather than catching exceptions themselves
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return {}


def _get_jwk(kid: str) -> dict | None:
    # lazy-fetch the JWKS the first time we see an unknown kid, then cache every key from the response
    # hitting the JWKS endpoint on every request would be slow and unnecessary since keys rarely rotate
    if kid not in _jwks_cache:
        try:
            resp = httpx.get(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json", timeout=10)
            resp.raise_for_status()
            for key in resp.json().get("keys", []):
                _jwks_cache[key["kid"]] = key
        except Exception as e:
            print(f"[auth] Failed to fetch JWKS: {e}")
    return _jwks_cache.get(kid)


def decode_supabase_token(token: str) -> dict:
    # decodes Supabase-issued teacher tokens — same return contract as decode_token (empty dict on failure)
    # newer Supabase projects sign with ES256 using a rotating key pair, so we verify against the JWKS
    # older projects use HS256 with a static secret — fall back to that so both setups work
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            kid = header.get("kid", "")
            key = _get_jwk(kid)
            if not key:
                print(f"[auth] No JWKS key found for kid={kid}")
                return {}
            return jwt.decode(token, key, algorithms=["ES256"], audience="authenticated")
        else:
            # supabase signs with the raw bytes of the secret, not the base64 string itself
            secret = base64.b64decode(settings.supabase_jwt_secret)
            return jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
    except JWTError as e:
        print(f"[auth] Supabase JWT decode failed: {e}")
        return {}

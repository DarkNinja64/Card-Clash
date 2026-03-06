from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from config import settings

# using bcrypt directly instead of passlib — passlib is unmaintained and crashes on Python 3.12+
# see docs for the full story on why passlib got dropped


def hash_password(password: str) -> str:
    # gensalt() generates a new random salt every call so two identical passwords get different hashes
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    # checkpw does a constant-time comparison to prevent timing attacks
    # (an attacker can't tell if a password is "almost right" by measuring response time)
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict) -> str:
    # copy the dict so we don't mutate whatever the caller passed in
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload["exp"] = expire  # exp is the standard JWT expiry claim, jose validates this automatically
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    # returns {} on any failure — expired, bad signature, totally malformed, whatever
    # callers just do `if not payload` rather than catching exceptions themselves
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return {}

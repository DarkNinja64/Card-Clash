from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.auth_service import decode_supabase_token, decode_token

# HTTPBearer pulls the token out of the "Authorization: Bearer <token>" header automatically
bearer_scheme = HTTPBearer()


# use this as Depends(get_current_teacher) on any route only teachers should hit
# teachers authenticate via Supabase so we verify with the Supabase secret, not our own
# raises 401 if the token is missing, invalid, or not a real Supabase session
def get_current_teacher(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    payload = decode_supabase_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return payload["sub"]  # sub is the Supabase user UUID


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    # works for student join tokens (backend-issued) — gives back the full token payload
    # teachers should use get_current_teacher() since their Supabase tokens won't decode here
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return payload

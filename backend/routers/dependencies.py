from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.auth_service import decode_token

# HTTPBearer pulls the token out of the "Authorization: Bearer <token>" header automatically
bearer_scheme = HTTPBearer()


# use this as Depends(get_current_teacher) on any route only teachers should hit
# decodes the token, checks the role, and returns the teacher's user id
# raises 401 if the token is missing, invalid, or belongs to a non-teacher
def get_current_teacher(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "teacher":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return payload["sub"]


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    # works for both teachers and students, gives back the full token payload
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return payload

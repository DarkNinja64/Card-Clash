import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.game_session import GameSession
from models.player import Player
from models.user import User
from schemas.auth import (
    StudentJoin,
    StudentJoinResponse,
    TeacherLogin,
    TeacherRegister,
    TokenResponse,
)
from services.auth_service import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_teacher(body: TeacherRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        # 409 conflict — email is taken, let them know specifically so they can log in instead
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        password_hash=hash_password(body.password),
        role="teacher",
    )
    db.add(user)
    await db.commit()

    # log them in immediately after registering so they don't have to hit /login separately
    token = create_access_token({"sub": user.id, "role": "teacher"})
    return TokenResponse(access_token=token, role="teacher")


@router.post("/login", response_model=TokenResponse)
async def login_teacher(body: TeacherLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # intentionally vague — don't tell the client whether it was the email or password that was wrong
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.id, "role": "teacher"})
    return TokenResponse(access_token=token, role="teacher")


@router.post("/student-join", response_model=StudentJoinResponse)
async def student_join(body: StudentJoin, db: AsyncSession = Depends(get_db)):
    # students don't have accounts, they just need a name and join code to get a token
    # normalize the code to uppercase so students don't have to worry about case
    result = await db.execute(
        select(GameSession).where(
            GameSession.join_code == body.join_code.upper(),
            GameSession.status == "lobby",  # can't join a game that's already started
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found or already started")

    player = Player(
        id=str(uuid.uuid4()),
        session_id=session.id,
        display_name=body.display_name.strip(),  # strip whitespace so "Alice " and "Alice" are the same
    )
    db.add(player)
    await db.commit()

    # display_name goes in the token so the socket layer can show names without a db lookup
    token = create_access_token({"sub": player.id, "role": "student", "session_id": session.id, "display_name": player.display_name})
    return StudentJoinResponse(
        player_id=player.id,
        display_name=player.display_name,
        session_id=session.id,
        access_token=token,
    )

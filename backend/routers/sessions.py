import random
import string
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.game_session import GameSession
from schemas.session import CreateSession, SessionResponse
from routers.dependencies import get_current_teacher

router = APIRouter(prefix="/sessions", tags=["sessions"])


# uppercase letters + digits gives 36^6 = ~2 billion possible codes, collisions are extremely rare
def _generate_join_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(
    body: CreateSession,
    teacher_id: str = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    # retry until we get a code that's not already taken — 10 tries is way more than enough
    for _ in range(10):
        code = _generate_join_code()
        existing = await db.execute(select(GameSession).where(GameSession.join_code == code))
        if not existing.scalar_one_or_none():
            break

    session = GameSession(
        id=str(uuid.uuid4()),
        host_id=teacher_id,
        join_code=code,
        status="lobby",
        config_json=body.config.model_dump(),
    )
    db.add(session)
    await db.commit()

    return SessionResponse(
        session_id=session.id,
        join_code=session.join_code,
        status=session.status,
        config=session.config_json,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        session_id=session.id,
        join_code=session.join_code,
        status=session.status,
        config=session.config_json,
    )


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    teacher_id: str = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GameSession)
        .where(GameSession.host_id == teacher_id)
        .order_by(GameSession.created_at.desc())  # newest first
    )
    sessions = result.scalars().all()
    return [
        SessionResponse(
            session_id=s.id,
            join_code=s.join_code,
            status=s.status,
            config=s.config_json,
        )
        for s in sessions
    ]

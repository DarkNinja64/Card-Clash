import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.game_session import GameSession
from models.player import Player
from schemas.auth import StudentJoin, StudentJoinResponse
from services.auth_service import create_access_token
from routers.dependencies import get_current_teacher as get_current_supabase_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Supabase handles all user accounts — teachers and students both authenticate via Supabase
# the frontend sends the Supabase JWT in the Authorization header for any protected route


@router.post("/student-join", response_model=StudentJoinResponse)
async def student_join(
    body: StudentJoin,
    user_id: str = Depends(get_current_supabase_user),  # requires a valid Supabase JWT
    db: AsyncSession = Depends(get_db),
):
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
        user_id=user_id,  # ties this game row back to their Supabase account
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

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


# players are ephemeral — a new row is created each time someone joins a session
# they're not real user accounts, just a display name tied to one session
# when we student accounts, this table gets replaced by session_players
class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String, ForeignKey("game_sessions.id"), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # TODO: final_score is never written right now — scores only live in memory during the game
    final_score: Mapped[int] = mapped_column(Integer, default=0)

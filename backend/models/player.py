import uuid

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


# a new row is created each time a student joins a session
# user_id ties the row back to their Supabase account so scores and history are trackable
class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String, ForeignKey("game_sessions.id"), nullable=False)
    user_id = Column(String, nullable=True)  # Supabase user UUID — Column() used to avoid Python 3.14 Mapped[Optional] bug
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # TODO: final_score is never written right now — scores only live in memory during the game
    final_score: Mapped[int] = mapped_column(Integer, default=0)

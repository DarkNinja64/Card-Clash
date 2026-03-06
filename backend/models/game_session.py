import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    host_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    # the 6-char code students type to join — uppercase alphanumeric, guaranteed unique
    join_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    # lobby, in_progress, or completed
    # NOTE: during a live game this only gets updated in memory — writing it back to the db is a TODO
    status: Mapped[str] = mapped_column(String(20), default="lobby")
    # game settings stored as a JSON blob (num_rounds, time_per_question, game_mode, etc.)
    config_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

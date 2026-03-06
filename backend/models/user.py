import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    # UUID instead of auto-increment int — harder to guess and safe to expose in URLs
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)  # never store plaintext
    # only "teacher" for now — when student accounts get added, "student" will also be valid here
    role: Mapped[str] = mapped_column(String(20), default="teacher")
    # server_default lets the database set the timestamp — more reliable than setting it in Python
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

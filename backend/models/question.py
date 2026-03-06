import uuid

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String, nullable=False)  # teacher who created this
    # deck_name groups questions together
    # this will eventually become a question_set_id FK when question sets are implemented
    deck_name: Mapped[str] = mapped_column(String(200), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # mc, tf, or short_answer
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="mc")
    options_json: Mapped[list] = mapped_column(JSON, default=list)  # list of answer option objects
    # plain string compared case-insensitively against student answers at scoring time
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    topic: Mapped[str] = mapped_column(String(100), nullable=True)
    # easy, medium, or hard
    difficulty: Mapped[str] = mapped_column(String(20), nullable=True)
    timer_seconds: Mapped[int] = mapped_column(default=60)

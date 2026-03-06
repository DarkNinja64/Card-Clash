import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.question import Question
from schemas.question import QuestionCreate, QuestionResponse, AnswerOption
from routers.dependencies import get_current_teacher

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("", response_model=QuestionResponse, status_code=201)
async def create_question(
    body: QuestionCreate,
    teacher_id: str = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    question = Question(
        id=str(uuid.uuid4()),
        owner_id=teacher_id,
        deck_name=body.deck_name,
        text=body.text,
        type=body.type,
        options_json=[o.model_dump() for o in body.options],  # convert pydantic objects to plain dicts for JSON storage
        correct_answer=body.correct_answer,
        topic=body.topic,
        difficulty=body.difficulty,
        timer_seconds=body.timer_seconds,
    )
    db.add(question)
    await db.commit()
    return _to_response(question)


@router.get("", response_model=list[QuestionResponse])
async def list_questions(
    teacher_id: str = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Question).where(Question.owner_id == teacher_id))
    return [_to_response(q) for q in result.scalars().all()]


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    teacher_id: str = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    # return 404 whether it doesn't exist OR belongs to someone else — don't leak that it exists
    if not question or question.owner_id != teacher_id:
        raise HTTPException(status_code=404, detail="Question not found")
    return _to_response(question)


@router.delete("/{question_id}", status_code=204)
async def delete_question(
    question_id: str,
    teacher_id: str = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    # same ownership check as get — 404 instead of 403 so we don't reveal other teachers' questions
    if not question or question.owner_id != teacher_id:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(question)
    await db.commit()


# converts a Question ORM object into the response schema
# needed because options_json comes back as raw dicts and needs to be cast to AnswerOption
def _to_response(q: Question) -> QuestionResponse:
    return QuestionResponse(
        id=q.id,
        deck_name=q.deck_name,
        text=q.text,
        type=q.type,
        options=[AnswerOption(**o) for o in (q.options_json or [])],
        correct_answer=q.correct_answer,
        topic=q.topic,
        difficulty=q.difficulty,
        timer_seconds=q.timer_seconds,
    )

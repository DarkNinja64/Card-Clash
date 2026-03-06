from pydantic import BaseModel


# a single answer choice for a multiple choice question
class AnswerOption(BaseModel):
    text: str
    correct: bool  # only one should be True per question


# full payload for creating a new question
class QuestionCreate(BaseModel):
    deck_name: str              # which deck this belongs to (e.g. "Unit 3 Review")
    text: str                   # the question body shown to students
    type: str = "mc"            # mc, tf, or short_answer
    options: list[AnswerOption] = []    # answer choices — only relevant for mc and tf
    correct_answer: str         # compared case-insensitively against student answers at scoring time
    topic: str = ""
    difficulty: str = "medium"  # easy, medium, or hard
    timer_seconds: int = 60     # how long students get to answer this question


# what gets returned when reading a question — same shape but includes the id
class QuestionResponse(BaseModel):
    id: str
    deck_name: str
    text: str
    type: str
    options: list[AnswerOption]
    correct_answer: str
    topic: str | None
    difficulty: str | None
    timer_seconds: int

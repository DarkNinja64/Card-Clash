from pydantic import BaseModel


# game settings the teacher configures when creating a session
# all fields have defaults so they can leave any of these out
class GameConfig(BaseModel):
    num_rounds: int = 10
    time_per_question: int = 30  # in seconds
    topic: str = ""
    game_mode: str = "individual"  # individual or team


# the request body for POST /sessions
# config is fully optional — omitting it uses all the GameConfig defaults
class CreateSession(BaseModel):
    config: GameConfig = GameConfig()


# what gets sent back when a session is created or fetched
class SessionResponse(BaseModel):
    session_id: str
    join_code: str  # the 6-char code students type to join
    status: str     # lobby, in_progress, or completed
    config: dict

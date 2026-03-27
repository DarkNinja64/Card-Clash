from pydantic import BaseModel

# TeacherRegister, TeacherLogin, and TokenResponse have been removed
# teacher auth is now handled entirely by Supabase on the frontend


# what a student sends to join a session — no account needed, just a name and the join code
class StudentJoin(BaseModel):
    display_name: str
    join_code: str


# what gets returned to students after joining
# player_id and session_id are embedded in the token so the socket layer
# can identify the player without hitting the database on every event
class StudentJoinResponse(BaseModel):
    player_id: str
    display_name: str
    session_id: str
    access_token: str
    token_type: str = "bearer"

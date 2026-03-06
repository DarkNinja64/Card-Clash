from pydantic import BaseModel, EmailStr


# what the teacher sends to create an account
class TeacherRegister(BaseModel):
    email: EmailStr  # pydantic validates this is actually an email format
    password: str


# what the teacher sends to log in
class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


# what a student sends to join a session — no account needed, just a name and the join code
class StudentJoin(BaseModel):
    display_name: str
    join_code: str


# what gets returned to teachers after register or login
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


# what gets returned to students after joining
# player_id and session_id are embedded in the token so the socket layer
# can identify the player without hitting the database on every event
class StudentJoinResponse(BaseModel):
    player_id: str
    display_name: str
    session_id: str
    access_token: str
    token_type: str = "bearer"

========================================
  CARD CLASH - BACKEND SETUP
========================================

REQUIREMENTS: Python 3.11+, pip

SETUP
-----
1. python3 -m venv venv
2. source venv/bin/activate  (Windows: venv\Scripts\activate)
3. pip install -r requirements.txt
4. Create a .env file in the backend/ folder (see below)
5. uvicorn main:combined_app --reload

Always use main:combined_app — main:app runs FastAPI only and breaks socket.io.
Server runs at http://localhost:8000, docs at http://localhost:8000/docs.
Press Ctrl+C to stop. Run deactivate to leave the venv.

.ENV FILE
---------
DATABASE_URL=sqlite+aiosqlite:///./cardclash.db
REDIS_URL=redis://localhost:6379
JWT_SECRET=any-long-random-string
SUPABASE_JWT_SECRET=from Supabase dashboard -> Settings -> API -> JWT Settings -> JWT Secret
SUPABASE_URL=from Supabase dashboard -> Settings -> API -> Project URL
SUPABASE_ANON_KEY=from Supabase dashboard -> Settings -> API -> Project API keys -> anon/public
FRONTEND_ORIGIN=http://localhost:3000

# optional — only needed if running test_socket.py
TEST_TEACHER_EMAIL=a teacher account that exists in Supabase
TEST_TEACHER_PASSWORD=
TEST_STUDENT_EMAIL=a student account that exists in Supabase
TEST_STUDENT_PASSWORD=

.env is gitignored so everyone needs their own copy.

JWT NOTE: newer Supabase projects sign tokens with ES256 instead of HS256. The backend
handles both automatically by checking the token header and fetching the public key from
Supabase's JWKS endpoint when needed. SUPABASE_JWT_SECRET is only used as an HS256 fallback.

REST ENDPOINTS
--------------
POST /auth/student-join     student joins with a display name + join code, gets back a JWT for socket auth
POST /sessions              teacher creates a session, gets back session_id and 6-char join_code (needs Supabase JWT)
GET  /sessions              teacher lists their sessions (needs Supabase JWT)
GET  /sessions/{id}         fetch a session by ID
GET  /health                returns {"status": "ok"}

SOCKET.IO EVENTS
----------------
Connect with { token: "<jwt>" } in the handshake auth — teachers use their Supabase token,
students use the token from /auth/student-join.

Client -> Server:
  join_lobby      { session_id }                          join the lobby room
  start_game      { session_id, questions: [...] }        teacher starts the game
  submit_answer   { session_id, answer, time_ms }         student submits an answer
  advance_round   { session_id }                          teacher moves to next question

Server -> Client:
  lobby_update    { players }          fires when someone joins or leaves the lobby
  game_start      { total_rounds }     fires when teacher starts the game
  next_question   { round_number, total_rounds, question }
  round_result    { round_number, leaderboard }
  game_over       { final_standings }

RUNNING THE INTEGRATION TEST
-----------------------------
Make sure the server is running, then from the backend/ folder: python test_socket.py
The test signs in two accounts via Supabase, creates a session, runs a 2-question game,
and asserts that lobby_update, round_result, and game_over all fired correctly.
Requires TEST_TEACHER_EMAIL/PASSWORD and TEST_STUDENT_EMAIL/PASSWORD in your .env.

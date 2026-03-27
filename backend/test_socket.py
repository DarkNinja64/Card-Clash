# quick integration test — start the server first, then run this
# uvicorn main:combined_app --reload --port 8000
# then: python test_socket.py
#
# requires four entries in your .env before running:
#   TEST_TEACHER_EMAIL / TEST_TEACHER_PASSWORD — a teacher account in Supabase
#   TEST_STUDENT_EMAIL / TEST_STUDENT_PASSWORD — a student account in Supabase

import asyncio
import os

import httpx
import socketio
from dotenv import load_dotenv

load_dotenv()

BASE         = "http://localhost:8000"
SUPABASE_URL = os.environ["SUPABASE_URL"]
ANON_KEY     = os.environ["SUPABASE_ANON_KEY"]


async def supabase_sign_in(email: str, password: str) -> str:
    # hits the Supabase auth REST endpoint directly to get an access token
    # same flow the frontend uses under the hood when signInWithPassword is called
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
            json={"email": email, "password": password},
        )
        r.raise_for_status()
        return r.json()["access_token"]


async def create_session(teacher_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{BASE}/sessions",
            json={"config": {"num_rounds": 2, "time_per_question": 30}},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        r.raise_for_status()
        return r.json()  # {session_id, join_code, ...}


async def student_join(student_token: str, display_name: str, join_code: str) -> dict:
    # student_token is the Supabase JWT — required since student-join is now a protected route
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{BASE}/auth/student-join",
            json={"display_name": display_name, "join_code": join_code},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        r.raise_for_status()
        return r.json()  # {player_id, session_id, access_token, ...}


async def main():
    print("=== Card Clash Socket.IO Test ===\n")

    teacher_email   = os.environ["TEST_TEACHER_EMAIL"]
    teacher_pass    = os.environ["TEST_TEACHER_PASSWORD"]
    student_email   = os.environ["TEST_STUDENT_EMAIL"]
    student_pass    = os.environ["TEST_STUDENT_PASSWORD"]

    # get Supabase tokens for teacher and student
    teacher_token = await supabase_sign_in(teacher_email, teacher_pass)
    student_token = await supabase_sign_in(student_email, student_pass)
    print(f"[auth] Teacher token: {teacher_token[:40]}...")
    print(f"[auth] Student token: {student_token[:40]}...")

    # teacher creates a session
    session = await create_session(teacher_token)
    session_id = session["session_id"]
    join_code  = session["join_code"]
    print(f"[REST] Session created — join code: {join_code}")

    # two students join via REST — both use the same student Supabase account for simplicity
    # in a real game each student would have their own account
    alice = await student_join(student_token, "Alice", join_code)
    bob   = await student_join(student_token, "Bob",   join_code)
    print(f"[REST] Alice player_id: {alice['player_id']}")
    print(f"[REST] Bob   player_id: {bob['player_id']}\n")

    # connect everyone via socket
    teacher_sio = socketio.AsyncClient()
    alice_sio   = socketio.AsyncClient()
    bob_sio     = socketio.AsyncClient()

    # track which events the teacher receives so we can assert at the end
    received_events = []

    @teacher_sio.on("lobby_update")
    async def on_lobby(data):
        players = [p["name"] for p in data["players"]]
        print(f"[socket teacher] lobby_update → players: {players}")
        received_events.append(("lobby_update", players))

    @teacher_sio.on("round_result")
    async def on_round_teacher(data):
        print(f"[socket teacher] round_result → leaderboard: {data['leaderboard']}")
        received_events.append(("round_result", data))
        # teacher moves to the next round after seeing results
        await asyncio.sleep(0.5)
        await teacher_sio.emit("advance_round", {"session_id": session_id})

    @teacher_sio.on("game_over")
    async def on_game_over(data):
        print(f"[socket teacher] game_over → {data['final_standings']}")
        received_events.append(("game_over", data))

    @alice_sio.on("next_question")
    async def alice_question(data):
        q = data["question"]
        print(f"[socket alice ] next_question → '{q['text']}'")
        # alice answers correctly
        await asyncio.sleep(0.5)
        await alice_sio.emit("submit_answer", {
            "session_id": session_id,
            "answer": "Paris",
            "time_ms": 500,
        })

    @bob_sio.on("next_question")
    async def bob_question(data):
        q = data["question"]
        print(f"[socket bob   ] next_question → '{q['text']}'")
        # bob answers wrong
        await asyncio.sleep(1.0)
        await bob_sio.emit("submit_answer", {
            "session_id": session_id,
            "answer": "London",
            "time_ms": 1000,
        })

    @alice_sio.on("game_over")
    async def alice_game_over(data):
        print(f"[socket alice ] game_over received")

    @bob_sio.on("game_over")
    async def bob_game_over(data):
        print(f"[socket bob   ] game_over received")

    # connect all three — listeners must be registered before connecting or early events are missed
    await teacher_sio.connect(BASE, auth={"token": teacher_token}, socketio_path="/socket.io")
    await alice_sio.connect(BASE,   auth={"token": alice["access_token"]}, socketio_path="/socket.io")
    await bob_sio.connect(BASE,     auth={"token": bob["access_token"]},   socketio_path="/socket.io")

    # everyone joins the lobby
    await teacher_sio.emit("join_lobby", {"session_id": session_id})
    await alice_sio.emit("join_lobby",   {"session_id": session_id})
    await bob_sio.emit("join_lobby",     {"session_id": session_id})
    await asyncio.sleep(0.5)  # let lobby_update fire before starting

    # teacher starts the game with two sample questions
    sample_questions = [
        {
            "id": "q1",
            "text": "What is the capital of France?",
            "type": "mc",
            "options": [
                {"text": "Paris",  "correct": True},
                {"text": "London", "correct": False},
                {"text": "Berlin", "correct": False},
            ],
            "correct_answer": "Paris",
            "timer_seconds": 30,
        },
        {
            "id": "q2",
            "text": "What is 2 + 2?",
            "type": "mc",
            "options": [
                {"text": "3", "correct": False},
                {"text": "4", "correct": True},
                {"text": "5", "correct": False},
            ],
            "correct_answer": "4",
            "timer_seconds": 30,
        },
    ]

    print("\n[socket teacher] emitting start_game...")
    await teacher_sio.emit("start_game", {"session_id": session_id, "questions": sample_questions})

    # give it enough time to finish — 2 rounds * ~2.5s each + buffer
    await asyncio.sleep(8)

    await teacher_sio.disconnect()
    await alice_sio.disconnect()
    await bob_sio.disconnect()

    print("\n=== Test complete ===")
    print(f"Events received: {[e[0] for e in received_events]}")
    assert any(e[0] == "lobby_update" for e in received_events), "lobby_update never fired"
    assert any(e[0] == "round_result" for e in received_events), "round_result never fired"
    assert any(e[0] == "game_over"    for e in received_events), "game_over never fired"
    print("All assertions passed.")


if __name__ == "__main__":
    asyncio.run(main())

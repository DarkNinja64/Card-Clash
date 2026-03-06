# all the socket game events live here
# sockets auth with a JWT in the handshake: { token: "<jwt>" }
# rooms are named session_{session_id}

import socketio

from services.auth_service import decode_token

# live game state keyed by session_id, each session has players, status, current_round, and answers
_game_state: dict = {}


def register_handlers(sio: socketio.AsyncServer):

    @sio.event
    async def connect(sid, environ, auth):
        token = (auth or {}).get("token", "")
        payload = decode_token(token)
        if not payload:
            # no token or bad token — kick them immediately, don't let unauthenticated sockets hang around
            await sio.disconnect(sid)
            return False

        role = payload.get("role")
        # session_id is only embedded in student tokens — teachers don't belong to a specific session
        session_id = payload.get("session_id") if role == "student" else None
        player_id = payload.get("sub")

        # store their identity on the socket so every event handler can grab it without re-decoding
        await sio.save_session(sid, {"payload": payload, "session_id": session_id})

        if session_id:
            await sio.enter_room(sid, f"session_{session_id}")

        print(f"[socket] connect sid={sid} role={role} player={player_id}")

    @sio.event
    async def disconnect(sid):
        session = await sio.get_session(sid)
        session_id = session.get("session_id")
        payload = session.get("payload", {})
        player_id = payload.get("sub")

        if session_id and session_id in _game_state:
            # remove them from the player list and tell everyone else they're gone
            _game_state[session_id]["players"].pop(player_id, None)
            await _broadcast_lobby(sio, session_id)

        print(f"[socket] disconnect sid={sid}")

    @sio.event
    async def join_lobby(sid, data):
        # both teachers and students call this to join the room, only students get added to the player list
        session = await sio.get_session(sid)
        payload = session.get("payload", {})
        session_id = data.get("session_id")
        player_id = payload.get("sub")
        role = payload.get("role")
        display_name = payload.get("display_name", "Player")

        if not session_id:
            return

        if session_id not in _game_state:
            # lazy init — the first person to join creates the in-memory state for this session
            _game_state[session_id] = {
                "players": {},
                "status": "lobby",
                "current_round": 0,
                "answers": {},
            }

        await sio.enter_room(sid, f"session_{session_id}")
        await sio.save_session(sid, {**session, "session_id": session_id})

        if role == "student":
            _game_state[session_id]["players"][player_id] = {
                "name": display_name,
                "score": 0,
                "sid": sid,
            }

        await _broadcast_lobby(sio, session_id)

    @sio.event
    async def start_game(sid, data):
        # teacher starts the game and sends the question list
        session = await sio.get_session(sid)
        payload = session.get("payload", {})
        if payload.get("role") != "teacher":
            return

        session_id = data.get("session_id")
        questions = data.get("questions", [])

        if session_id not in _game_state:
            return

        state = _game_state[session_id]
        state["status"] = "in_progress"
        state["questions"] = questions
        state["current_round"] = 0  # always reset to 0 in case start_game is somehow called twice

        await sio.emit("game_start", {"total_rounds": len(questions)}, room=f"session_{session_id}")
        await _send_next_question(sio, session_id)

    @sio.event
    async def submit_answer(sid, data):
        # student submits their answer for the current round
        session = await sio.get_session(sid)
        payload = session.get("payload", {})
        player_id = payload.get("sub")
        session_id = data.get("session_id")

        if not session_id or session_id not in _game_state:
            return

        state = _game_state[session_id]

        # one answer per player per round
        if player_id in state["answers"]:
            return

        state["answers"][player_id] = {
            "answer": data.get("answer", ""),
            "time_ms": data.get("time_ms", 9999),  # 9999ms default means max penalty if they skip the field
        }

        # score right away if everyone's answered
        if len(state["answers"]) >= len(state["players"]):
            await _score_round(sio, session_id)

    @sio.event
    async def advance_round(sid, data):
        # teacher moves to the next question after seeing the results
        session = await sio.get_session(sid)
        payload = session.get("payload", {})
        if payload.get("role") != "teacher":
            return

        session_id = data.get("session_id")
        if session_id not in _game_state:
            return

        state = _game_state[session_id]
        state["current_round"] += 1
        state["answers"] = {}  # clear answers from last round so the next round starts fresh

        questions = state.get("questions", [])
        if state["current_round"] >= len(questions):
            await _end_game(sio, session_id)
        else:
            await _send_next_question(sio, session_id)


# helpers

async def _broadcast_lobby(sio: socketio.AsyncServer, session_id: str):
    state = _game_state.get(session_id, {})
    players = [
        {"player_id": pid, "name": info["name"]}
        for pid, info in state.get("players", {}).items()
    ]
    await sio.emit("lobby_update", {"players": players}, room=f"session_{session_id}")


async def _send_next_question(sio: socketio.AsyncServer, session_id: str):
    state = _game_state[session_id]
    questions = state.get("questions", [])
    idx = state["current_round"]

    if idx >= len(questions):
        await _end_game(sio, session_id)
        return

    q = questions[idx]
    await sio.emit(
        "next_question",
        {
            "round_number": idx + 1,
            "total_rounds": len(questions),
            "question": {
                "id": q.get("id"),
                "text": q.get("text"),
                "type": q.get("type", "mc"),
                "options": q.get("options", []),
                "timer_seconds": q.get("timer_seconds", 30),
            },
        },
        room=f"session_{session_id}",
    )


async def _score_round(sio: socketio.AsyncServer, session_id: str):
    state = _game_state[session_id]
    questions = state.get("questions", [])
    idx = state["current_round"]
    question = questions[idx]
    correct_answer = question.get("correct_answer", "").strip().lower()

    results = []
    for player_id, submission in state["answers"].items():
        player = state["players"].get(player_id, {})
        # strip and lowercase both sides so "Paris", "paris", " paris " all count as correct
        given = submission["answer"].strip().lower()
        is_correct = given == correct_answer
        # 100 base points + up to 50 speed bonus — faster answers earn more
        time_ms = submission["time_ms"]
        timer_ms = question.get("timer_seconds", 30) * 1000
        speed_bonus = max(0, int(50 * (1 - time_ms / timer_ms))) if timer_ms > 0 else 0
        points = (100 + speed_bonus) if is_correct else 0

        player["score"] = player.get("score", 0) + points
        results.append({
            "player_id": player_id,
            "name": player.get("name"),
            "is_correct": is_correct,
            "points_earned": points,
            "total_score": player["score"],
        })

    # sort highest score first so the frontend can just render the list in order
    leaderboard = sorted(results, key=lambda r: r["total_score"], reverse=True)
    await sio.emit(
        "round_result",
        {"round_number": idx + 1, "leaderboard": leaderboard},
        room=f"session_{session_id}",
    )


async def _end_game(sio: socketio.AsyncServer, session_id: str):
    state = _game_state[session_id]
    state["status"] = "completed"

    final = sorted(
        [
            {"player_id": pid, "name": info["name"], "score": info["score"]}
            for pid, info in state["players"].items()
        ],
        key=lambda p: p["score"],
        reverse=True,
    )

    await sio.emit("game_over", {"final_standings": final}, room=f"session_{session_id}")
    # clean up memory — the game is done and we don't need this state anymore
    _game_state.pop(session_id, None)

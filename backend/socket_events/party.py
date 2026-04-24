import asyncio
import random
import time

import httpx
import socketio

from config import settings
from services.auth_service import decode_supabase_token

ANALYZE_S = 20
RESOLVE_S = 2
ANSWER_S = 20

_DEFAULT_QUESTION_POOL = [
    {'id': 'q1', 'category': 'Physics', 'question': 'What keeps a moving bicycle upright?', 'answer': 'Gyroscopic precession'},
    {'id': 'q2', 'category': 'Math', 'question': 'Solve: 2x + 5 = 15', 'answer': 'x = 5'},
    {'id': 'q3', 'category': 'Biology', 'question': 'What organelle powers the cell?', 'answer': 'Mitochondria'},
    {'id': 'q4', 'category': 'Chemistry', 'question': 'pH less than 7 is?', 'answer': 'Acidic'},
    {'id': 'q5', 'category': 'History', 'question': 'Who wrote the Constitution (US)?', 'answer': 'James Madison'},
    {'id': 'q6', 'category': 'CS', 'question': 'Big-O for binary search?', 'answer': 'O(log n)'},
    {'id': 'q7', 'category': 'Algebra', 'question': 'Factor: x^2 - 9', 'answer': '(x-3)(x+3)'},
    {'id': 'q8', 'category': 'Geo', 'question': 'Capital of Japan?', 'answer': 'Tokyo'},
    {'id': 'q9', 'category': 'Lit', 'question': 'Author of 1984?', 'answer': 'George Orwell'},
    {'id': 'q10', 'category': 'Bio', 'question': 'DNA stands for?', 'answer': 'Deoxyribonucleic acid'},
]

# live lobby state keyed by 5-char lobby code
_lobbies: dict = {}


def _make_code() -> str:
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choices(chars, k=5))


def _shuffle(lst: list) -> list:
    lst = list(lst)
    for i in range(len(lst) - 1, 0, -1):
        j = random.randint(0, i)
        lst[i], lst[j] = lst[j], lst[i]
    return lst


def _create_player(sid: str, name: str, user_id: str = '') -> dict:
    return {
        'id': sid,
        'user_id': user_id,   # Supabase user UUID — used for reconnect matching
        'name': name or 'Player',
        'score': 0,
        'question': None,
        'swapUsed': False,
        'lockUsed': False,
        'wantsSwap': False,
        'wantsLock': False,
        'swappedThisRound': False,
        'answered': False,
    }


def _serialize_player(p: dict) -> dict:
    # strip server-only fields before sending to clients
    return {k: v for k, v in p.items() if k != 'user_id'}


def _serialize(lobby: dict) -> dict:
    return {
        'code': lobby['code'],
        'hostId': lobby['hostId'],
        'status': lobby['status'],
        'round': lobby['round'],
        'maxRounds': lobby.get('maxRounds', 5),
        'timerS': lobby.get('timer_s', 20),
        'phase': lobby['phase'],
        'phaseEndsAt': lobby['phaseEndsAt'],
        'players': [_serialize_player(p) for p in lobby['players'].values()],
    }


def _assign_questions(lobby: dict) -> None:
    players = list(lobby['players'].values())
    source = lobby['questionPool'] or _DEFAULT_QUESTION_POOL
    pool = _shuffle(source)
    while len(pool) < len(players):
        pool += _shuffle(source)
    for i, player in enumerate(players):
        player['question'] = pool[i]


def _reset_round(lobby: dict) -> None:
    for p in lobby['players'].values():
        p['answered'] = False
        p['swappedThisRound'] = False
        p['wantsSwap'] = False
        p['wantsLock'] = False


def _resolve_swap_lock(lobby: dict) -> None:
    players = list(lobby['players'].values())
    locked = {p['id'] for p in players if p['wantsLock'] and not p['lockUsed']}
    for p in players:
        if p['wantsLock'] and not p['lockUsed']:
            p['lockUsed'] = True

    swappers = _shuffle([p for p in players if p['wantsSwap'] and not p['swapUsed'] and p['id'] not in locked])
    eligible = [p for p in players if p['id'] not in locked]
    used: set = set()

    for swapper in swappers:
        candidates = [p for p in eligible if p['id'] != swapper['id'] and p['id'] not in used]
        if not candidates:
            # No eligible partner (everyone locked) — pull a random question from the pool instead
            pool = lobby.get('questionPool') or _DEFAULT_QUESTION_POOL
            current_id = str(swapper['question']['id']) if swapper.get('question') else None
            alternates = [q for q in pool if str(q['id']) != current_id]
            if alternates:
                swapper['question'] = random.choice(alternates)
                swapper['swapUsed'] = True
                swapper['swappedThisRound'] = True
            continue
        target = random.choice(candidates)
        used.add(target['id'])
        swapper['question'], target['question'] = target['question'], swapper['question']
        swapper['swapUsed'] = True
        swapper['swappedThisRound'] = True


async def _fetch_questions(deck_id: str | None = None) -> list | None:
    key = settings.supabase_service_role_key or settings.supabase_anon_key
    if not key or not settings.supabase_url:
        return None
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.supabase_url}/rest/v1/deck_question_cards?deck_id=eq.{deck_id}&select=id,question_text,deck_question_card_answer_options(answer_text,is_correct)",
                headers={
                    'apikey': key,
                    'Authorization': f'Bearer {key}',
                },
                timeout=10,
            )
            resp.raise_for_status()
            rows = resp.json()
            if not rows:
                return None
            return [
               {
                   'id': str(q['id']),
                   'question': q.get('question_text', ''),
                   'answer': next(
                       (opt['answer_text'] for opt in q.get('deck_question_card_answer_options', []) if opt.get('is_correct')),
                       ''
                   ),
                   'options': [opt['answer_text'] for opt in q.get('deck_question_card_answer_options', [])],
               }
               for q in rows
               if q.get('deck_question_card_answer_options')  # skip cards with no answer options
           ]
    except Exception as e:
        print(f"[party] Supabase question fetch failed: {e}")
        return None


class PartyNamespace(socketio.AsyncNamespace):

    async def on_connect(self, sid, environ, auth):
        token = (auth or {}).get('token', '')
        payload = decode_supabase_token(token)
        if not payload:
            return False  # reject — no valid Supabase JWT
        # store user_id so we can re-match this player if they reconnect with a new sid
        await self.save_session(sid, {'user_id': payload.get('sub', '')})
        print(f"[party] connect sid={sid} user={payload.get('sub')}")

    async def on_disconnect(self, sid):
        for lobby in list(_lobbies.values()):
            if lobby['hostId'] == sid:
                # host left — cancel game and notify players
                task = lobby.get('phaseTask')
                if task:
                    task.cancel()
                lobby['status'] = 'game_over'
                lobby['phase'] = 'game_over'
                await self._broadcast_game(lobby)
                _lobbies.pop(lobby['code'], None)
                return
            if sid not in lobby['players']:
                continue
            lobby['players'].pop(sid)
            if not lobby['players']:
                task = lobby.get('phaseTask')
                if task:
                    task.cancel()
                _lobbies.pop(lobby['code'], None)
                return
            await self._broadcast_lobby(lobby)
        print(f"[party] disconnect sid={sid}")

    async def on_create_lobby(self, sid, data):
        name = (data or {}).get('name', 'Host')
        code = _make_code()
        while code in _lobbies:
            code = _make_code()
        _lobbies[code] = {
            'code': code,
            'hostId': sid,
            'status': 'lobby',
            'round': 0,
            'maxRounds': 5,
            'timer_s': 20,
            'phase': 'waiting',
            'phaseEndsAt': None,
            'players': {},
            'phaseTask': None,
            'questionPool': None,
            'deck_id': None,
        }
        await self.enter_room(sid, code)
        await self._broadcast_lobby(_lobbies[code])

    async def on_join_lobby(self, sid, data):
        code = (data or {}).get('code', '').upper()
        name = (data or {}).get('name', 'Player')
        lobby = _lobbies.get(code)
        if not lobby:
            await self.emit('error_message', {'message': 'Lobby not found.'}, to=sid)
            return
        if lobby['status'] != 'lobby':
            await self.emit('error_message', {'message': 'Game already in progress.'}, to=sid)
            return
        session = await self.get_session(sid)
        user_id = session.get('user_id', '')
        lobby['players'][sid] = _create_player(sid, name, user_id)
        await self.enter_room(sid, code)
        await self._broadcast_lobby(lobby)

    async def on_get_lobby_state(self, sid, data):
        """Client calls this on mount to get current state — handles page refresh and new tabs."""
        code = (data or {}).get('code', '').upper()
        lobby = _lobbies.get(code)
        if not lobby:
            await self.emit('error_message', {'message': 'Lobby not found.'}, to=sid)
            return

        # already in the lobby as host or player — just resend state
        if lobby['hostId'] == sid or sid in lobby['players']:
            await self.enter_room(sid, code)
            await self.emit('game_update', _serialize(lobby), to=sid)
            return

        # reconnect case: same user, new socket id — re-register the player
        session = await self.get_session(sid)
        user_id = session.get('user_id', '')
        if user_id:
            for old_sid, player in list(lobby['players'].items()):
                if player.get('user_id') == user_id:
                    del lobby['players'][old_sid]
                    player['id'] = sid
                    lobby['players'][sid] = player
                    await self.enter_room(sid, code)
                    await self.emit('game_update', _serialize(lobby), to=sid)
                    print(f"[party] reconnected user={user_id} old_sid={old_sid} new_sid={sid}")
                    return

        await self.emit('error_message', {'message': 'You are not in this lobby.'}, to=sid)

    async def on_start_game(self, sid, data):
        code = (data or {}).get('code', '')
        lobby = _lobbies.get(code)
        if not lobby or lobby['hostId'] != sid:
            await self.emit('error_message', {'message': 'Only the host can start the game.'}, to=sid)
            return
        lobby['maxRounds'] = max(1, min(20, int((data or {}).get('rounds', 5))))
        lobby['timer_s'] = max(10, min(60, int((data or {}).get('timer_seconds', 20))))
        deck_id = (data or {}).get('deck_id') or None
        lobby['deck_id'] = deck_id
        lobby['questionPool'] = await _fetch_questions(deck_id)
        if not lobby['questionPool']:
            print(f"[party] No questions found for deck_id={deck_id!r}, using default pool")
        lobby['status'] = 'in_game'
        lobby['round'] = 1
        await self._start_round(lobby)



    async def on_end_game(self, sid, data):
        """Host explicitly ends the game early."""
        code = (data or {}).get('code', '')
        lobby = _lobbies.get(code)
        if not lobby or lobby['hostId'] != sid:
            return
        task = lobby.get('phaseTask')
        if task:
            task.cancel()
        lobby['status'] = 'game_over'
        lobby['phase'] = 'game_over'
        await self._broadcast_game(lobby)
        _lobbies.pop(code, None)

    async def on_submit_answer(self, sid, data):
        code = (data or {}).get('code', '')
        correct = bool((data or {}).get('correct', False))
        lobby = _lobbies.get(code)
        if not lobby or lobby['phase'] != 'answer':
            return
        player = lobby['players'].get(sid)
        if not player or player['answered']:
            return
        base = 10 if correct else 0
        bonus = 10 if correct and player['swappedThisRound'] else 0
        player['score'] += base + bonus
        player['answered'] = True
        await self._broadcast_game(lobby)

    async def on_request_swap(self, sid, data):
        code = (data or {}).get('code', '')
        lobby = _lobbies.get(code)
        if not lobby or lobby['phase'] != 'analyze':
            return
        player = lobby['players'].get(sid)
        if not player or player['swapUsed']:
            return
        player['wantsSwap'] = True
        await self._broadcast_game(lobby)

    async def on_request_lock(self, sid, data):
        code = (data or {}).get('code', '')
        lobby = _lobbies.get(code)
        if not lobby or lobby['phase'] != 'analyze':
            return
        player = lobby['players'].get(sid)
        if not player or player['lockUsed']:
            return
        player['wantsLock'] = True
        await self._broadcast_game(lobby)

    async def on_next_round(self, sid, data):
        code = (data or {}).get('code', '')
        lobby = _lobbies.get(code)
        if not lobby or lobby['hostId'] != sid or lobby['status'] == 'game_over':
            return
        lobby['round'] += 1
        await self._start_round(lobby)

    # --- helpers ---

    async def _start_round(self, lobby: dict) -> None:
        _reset_round(lobby)
        _assign_questions(lobby)
        task = lobby.get('phaseTask')
        if task:
            task.cancel()
        lobby['phaseTask'] = asyncio.create_task(self._phase_sequence(lobby))

    async def _phase_sequence(self, lobby: dict) -> None:
        timer_s = lobby.get('timer_s', ANALYZE_S)
        try:
            lobby['phase'] = 'analyze'
            lobby['phaseEndsAt'] = int(time.time() * 1000) + timer_s * 1000
            await self._broadcast_game(lobby)
            await asyncio.sleep(timer_s)

            lobby['phase'] = 'resolve'
            lobby['phaseEndsAt'] = int(time.time() * 1000) + RESOLVE_S * 1000
            _resolve_swap_lock(lobby)
            await self._broadcast_game(lobby)
            await asyncio.sleep(RESOLVE_S)

            lobby['phase'] = 'answer'
            lobby['phaseEndsAt'] = int(time.time() * 1000) + timer_s * 1000
            await self._broadcast_game(lobby)
            await asyncio.sleep(timer_s)

            lobby['phase'] = 'results'
            lobby['phaseEndsAt'] = None
            await self._broadcast_game(lobby)

            if lobby['round'] >= lobby.get('maxRounds', 5):
                lobby['status'] = 'game_over'
                lobby['phase'] = 'game_over'
                await self._broadcast_game(lobby)
                _lobbies.pop(lobby['code'], None)
        except asyncio.CancelledError:
            pass

    async def _broadcast_lobby(self, lobby: dict) -> None:
        await self.emit('lobby_update', _serialize(lobby), room=lobby['code'])

    async def _broadcast_game(self, lobby: dict) -> None:
        await self.emit('game_update', _serialize(lobby), room=lobby['code'])

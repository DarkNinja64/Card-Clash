const ANALYZE_MS = 20000;
const RESOLVE_MS = 2000;
const ANSWER_MS = 20000;

const QUESTION_POOL = [
  { id: 'q1', category: 'Physics', question: 'What keeps a moving bicycle upright?', answer: 'Gyroscopic precession' },
  { id: 'q2', category: 'Math', question: 'Solve: 2x + 5 = 15', answer: 'x = 5' },
  { id: 'q3', category: 'Biology', question: 'What organelle powers the cell?', answer: 'Mitochondria' },
  { id: 'q4', category: 'Chemistry', question: 'pH less than 7 is?', answer: 'Acidic' },
  { id: 'q5', category: 'History', question: 'Who wrote the Constitution (US)?', answer: 'James Madison' },
  { id: 'q6', category: 'CS', question: 'Big-O for binary search?', answer: 'O(log n)' },
  { id: 'q7', category: 'Algebra', question: 'Factor: x^2 - 9', answer: '(x-3)(x+3)' },
  { id: 'q8', category: 'Geo', question: 'Capital of Japan?', answer: 'Tokyo' },
  { id: 'q9', category: 'Lit', question: 'Author of 1984?', answer: 'George Orwell' },
  { id: 'q10', category: 'Bio', question: 'DNA stands for?', answer: 'Deoxyribonucleic acid' }
];

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function createPlayer(id, name) {
  return {
    id,
    name: name || 'Player',
    score: 0,
    question: null,
    swapUsed: false,
    lockUsed: false,
    wantsSwap: false,
    wantsLock: false,
    swappedThisRound: false,
    answered: false
  };
}

function createLobby({ code, hostId }) {
  return {
    code,
    hostId,
    status: 'lobby',
    round: 0,
    phase: 'waiting',
    phaseEndsAt: null,
    players: new Map(),
    phaseTimer: null
  };
}

function serializeLobby(lobby) {
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    status: lobby.status,
    round: lobby.round,
    phase: lobby.phase,
    phaseEndsAt: lobby.phaseEndsAt,
    players: Array.from(lobby.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      question: p.question,
      swapUsed: p.swapUsed,
      lockUsed: p.lockUsed,
      wantsSwap: p.wantsSwap,
      wantsLock: p.wantsLock,
      swappedThisRound: p.swappedThisRound,
      answered: p.answered
    }))
  };
}

function assignQuestions(lobby) {
  const players = Array.from(lobby.players.values());
  const pool = shuffle([...QUESTION_POOL]);
  if (players.length > pool.length) {
    while (pool.length < players.length) {
      pool.push(...QUESTION_POOL.map((q, idx) => ({ ...q, id: `${q.id}-x${idx}-${pool.length}` })));
    }
  }
  players.forEach((player, index) => {
    const q = pool[index % pool.length];
    player.question = q;
  });
}

function resetRoundState(lobby) {
  for (const player of lobby.players.values()) {
    player.answered = false;
    player.swappedThisRound = false;
    player.wantsSwap = false;
    player.wantsLock = false;
  }
}

function resolveSwapLock(lobby) {
  const players = Array.from(lobby.players.values());
  const locked = new Set(players.filter((p) => p.wantsLock && !p.lockUsed).map((p) => p.id));
  for (const p of players) {
    if (p.wantsLock && !p.lockUsed) p.lockUsed = true;
  }

  const swappers = players.filter((p) => p.wantsSwap && !p.swapUsed && !locked.has(p.id));
  const eligibleTargets = players.filter((p) => !locked.has(p.id));
  shuffle(swappers);

  const usedTargets = new Set();
  for (const swapper of swappers) {
    const candidates = eligibleTargets.filter((p) => p.id !== swapper.id && !usedTargets.has(p.id));
    if (candidates.length === 0) continue;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    usedTargets.add(target.id);
    const temp = swapper.question;
    swapper.question = target.question;
    target.question = temp;
    swapper.swapUsed = true;
    swapper.swappedThisRound = true;
  }
}

function schedulePhase(lobby, phase, durationMs, emit, nextPhaseFn) {
  lobby.phase = phase;
  lobby.phaseEndsAt = Date.now() + durationMs;
  emit(lobby);
  if (lobby.phaseTimer) clearTimeout(lobby.phaseTimer);
  lobby.phaseTimer = setTimeout(() => {
    nextPhaseFn();
  }, durationMs);
}

function startRound(lobby, emit) {
  resetRoundState(lobby);
  assignQuestions(lobby);
  schedulePhase(lobby, 'analyze', ANALYZE_MS, emit, () => {
    schedulePhase(lobby, 'resolve', RESOLVE_MS, emit, () => {
      resolveSwapLock(lobby);
      schedulePhase(lobby, 'answer', ANSWER_MS, emit, () => {
        lobby.phase = 'results';
        lobby.phaseEndsAt = null;
        emit(lobby);
      });
    });
  });
}

function submitAnswer(lobby, playerId, correct, emit) {
  if (lobby.phase !== 'answer') return;
  const player = lobby.players.get(playerId);
  if (!player || player.answered) return;
  const base = correct ? 10 : 0;
  const bonus = correct && player.swappedThisRound ? 10 : 0;
  player.score += base + bonus;
  player.answered = true;
  emit(lobby);
}

function requestSwap(lobby, playerId, emit) {
  if (lobby.phase !== 'analyze') return;
  const player = lobby.players.get(playerId);
  if (!player || player.swapUsed) return;
  player.wantsSwap = true;
  emit(lobby);
}

function requestLock(lobby, playerId, emit) {
  if (lobby.phase !== 'analyze') return;
  const player = lobby.players.get(playerId);
  if (!player || player.lockUsed) return;
  player.wantsLock = true;
  emit(lobby);
}

function nextRound(lobby, emit) {
  lobby.round += 1;
  startRound(lobby, emit);
}

module.exports = {
  createLobby,
  createPlayer,
  serializeLobby,
  startRound,
  submitAnswer,
  requestSwap,
  requestLock,
  nextRound
};

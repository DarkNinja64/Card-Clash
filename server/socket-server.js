require('dotenv').config( {path: '.env.local'} );

const http = require('http');
const { Server } = require('socket.io');
const {
  createLobby,
  createPlayer,
  serializeLobby,
  startRound,
  submitAnswer,
  requestSwap,
  requestLock,
  nextRound,
    setQuestionPool,
} = require('./game-engine');

const PORT = process.env.SOCKET_PORT || 4000;

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const lobbies = new Map();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // or anon key if RLS allows
);




function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function emitLobby(lobby) {
  io.to(lobby.code).emit('lobby_update', serializeLobby(lobby));
}

function emitGame(lobby) {
  io.to(lobby.code).emit('game_update', serializeLobby(lobby));
}

io.on('connection', (socket) => {
  socket.on('create_lobby', ({ name }) => {
    const code = makeCode();
    const lobby = createLobby({ code, hostId: socket.id });
    lobby.players.set(socket.id, createPlayer(socket.id, name || 'Host'));
    lobbies.set(code, lobby);
    socket.join(code);
    emitLobby(lobby);
  });

  socket.on('join_lobby', ({ code, name }) => {
    const lobby = lobbies.get(code);
    if (!lobby) {
      socket.emit('error_message', { message: 'Lobby not found.' });
      return;
    }
    lobby.players.set(socket.id, createPlayer(socket.id, name || 'Player'));
    socket.join(code);
    emitLobby(lobby);
  });

  socket.on('start_game', async ({ code }) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.hostId !== socket.id) {
      socket.emit('error_message', { message: 'Only the host can start the game.' });
      return;
    }

      socket.on('game_start', (payload) => {

      });

        // Fetch questions inside the async handler
        const { data: questions, error } = await supabase
            .from('question_card')
            .select('*')
            .limit(20);

    console.log('Supabase fetch:', { error, count: questions?.length, sample: questions?.[0] });

        if (!error && questions?.length > 0) {
            const mapped = questions.map(q => ({
                id: q.id,
                category: q.category,
                question: q.question,
                answer: q[`answer_option_${q.correct_answer_option}`]
            }));
            setQuestionPool(mapped);
        } else {
            setQuestionPool(null);
        }


    lobby.status = 'in_game';
    lobby.round = 1;


    startRound(lobby, emitGame);
  });

  socket.on('submit_answer', ({ code, correct }) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.status !== 'in_game') return;
    submitAnswer(lobby, socket.id, correct, emitGame);
  });

  socket.on('request_swap', ({ code }) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.status !== 'in_game') return;
    requestSwap(lobby, socket.id, emitGame);
  });

  socket.on('request_lock', ({ code }) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.status !== 'in_game') return;
    requestLock(lobby, socket.id, emitGame);
  });

  socket.on('next_round', ({ code }) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.hostId !== socket.id) return;
    nextRound(lobby, emitGame);
  });



  socket.on('disconnect', () => {
    for (const lobby of lobbies.values()) {
      if (lobby.players.has(socket.id)) {
        lobby.players.delete(socket.id);
        if (lobby.hostId === socket.id) {
          const nextHost = lobby.players.values().next().value;
          lobby.hostId = nextHost ? nextHost.id : '';
        }
        if (lobby.players.size === 0) {
          if (lobby.phaseTimer) clearTimeout(lobby.phaseTimer);
          lobbies.delete(lobby.code);
          return;
        }
        emitLobby(lobby);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Socket server running on http://localhost:${PORT}`);
});

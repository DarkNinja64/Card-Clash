'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPartySocket } from '@/lib/socket';
import styles from './party.module.css';
import UserName from "@/components/UserName";
import { Socket } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";

type Question = { id: string; question: string; answer?: string; options: string[] };
type Player = {
  id: string;
  name: string;
  score: number;
  question?: Question | null;
  swapUsed: boolean;
  lockUsed: boolean;
  wantsSwap: boolean;
  wantsLock: boolean;
  swappedThisRound: boolean;
  answered: boolean;
  selectedAnswer?: string | null;
};

type LobbyState = {
  code: string;
  hostId: string;
  status: 'lobby' | 'in_game' | 'game_over';
  round: number;
  maxRounds: number;
  timerS: number;
  phase: string;
  phaseEndsAt: number | null;
  players: Player[];
};

type PreloadedFeedback = {
  correct: string;
  incorrect: string;
};

function buildPartyFallback(question: string, correctAnswer: string): PreloadedFeedback {
  const shortQuestion = question.replace(/\s+/g, ' ').trim();

  return {
    correct: `On the question "${shortQuestion}", you chose ${correctAnswer}, and that answer fits what the question was asking. The important thing to remember is why ${correctAnswer} matches the idea being tested here. When you review this later, try to point to the exact clue in the question that led you to that answer.`,
    incorrect: `On the question "${shortQuestion}", the correct answer was ${correctAnswer}. What matters here is understanding why ${correctAnswer} fits the question better than the other choices. When you look back at it, focus on what concept the question is testing and which words in the prompt point you toward ${correctAnswer}.`,
  };
}

export default function PartyPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [hasAnsweredLocally, setHasAnsweredLocally] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [preloadedFeedback, setPreloadedFeedback] = useState<PreloadedFeedback | null>(null);
  const [preloadedQuestionId, setPreloadedQuestionId] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [homePath, setHomePath] = useState('/student_home');

  useEffect(() => {
    async function connect() {
      const supabase = createClient();
      const [{ data: { session } }, { data: { user } }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);
      if (!session?.access_token) return;

      const { data: profile } = user
        ? await supabase.from('profiles').select('role').eq('id', user.id).single()
        : { data: null };

      setHomePath(profile?.role === 'teacher' ? '/teacher_home' : '/student_home');

      const s = createPartySocket(session.access_token);
      setSocket(s);

      const requestState = () => {
        const code = localStorage.getItem('cc_lobby_code');
        if (code) s.emit('get_lobby_state', { code });
      };

      if (s.connected) {
        requestState();
      } else {
        s.once('connect', requestState);
      }
    }

    connect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: LobbyState) => {
      setLobby(data);
      if (data.phase === 'game_over' || data.status === 'game_over') {
        localStorage.removeItem('cc_lobby_code');
      }
      if (data.phase === 'answer') {
        setHasAnsweredLocally(false);
      }
      if (data.phase === 'analyze') {
        setSelectedOption(null);
      }
    };

    socket.on('lobby_update', handleUpdate);
    socket.on('game_update', handleUpdate);

    return () => {
      socket.off('lobby_update', handleUpdate);
      socket.off('game_update', handleUpdate);
    };
  }, [socket]);

  const me = socket && lobby?.players.find((p) => p.id === socket.id) || null;
  const timeLeftMs = lobby?.phaseEndsAt ? Math.max(lobby.phaseEndsAt - now, 0) : null;
  const timeLeft = timeLeftMs ? Math.ceil(timeLeftMs / 1000) : null;

  const submitAnswer = (answer: string) => {
    if (!lobby?.code || !socket || lobby.phase !== 'answer' || !me?.question) return;

    setHasAnsweredLocally(true);
    setSelectedOption(answer);

    const isCorrect = answer === me.question.answer;

    if (preloadedFeedback) {
      setAiFeedback(isCorrect ? preloadedFeedback.correct : preloadedFeedback.incorrect);
      setAiLoading(false);
      setAiError(null);
    } else {
      setAiLoading(true);
      setAiFeedback(null);
      setAiError(null);
      fetch('/api/study-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: me.question.question,
          correctAnswer: me.question.answer ?? '',
          userAnswer: answer,
          isCorrect,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setAiFeedback(data?.feedback || null);
        })
        .catch(() => {
          setAiError('AI feedback unavailable.');
        })
        .finally(() => setAiLoading(false));
    }

    socket.emit('submit_answer', { code: lobby.code, answer });
  };

  const requestSwap = () => {
    if (!lobby?.code || !socket) return;
    socket.emit('request_swap', { code: lobby.code });
  };

  const requestLock = () => {
    if (!lobby?.code || !socket) return;
    socket.emit('request_lock', { code: lobby.code });
  };

  const handleLeaveGame = () => {
    localStorage.removeItem('cc_lobby_code');
    socket?.disconnect();
    router.push(homePath);
  };

  useEffect(() => {
    if (!me?.question || !lobby || lobby.phase === 'game_over') return;
    if (preloadedQuestionId === me.question.id) return;

    let cancelled = false;
    setAiLoading(true);
    setAiError(null);
    setAiFeedback(null);
    setPreloadedFeedback(null);
    setPreloadedQuestionId(me.question.id);
    setSelectedOption(me.selectedAnswer ?? null);

    fetch('/api/study-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: me.question.question,
        correctAnswer: me.question.answer ?? '',
        preload: true,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPreloadedFeedback(data?.preloaded || buildPartyFallback(me.question.question, me.question.answer ?? 'the correct answer'));
      })
      .catch(() => {
        if (cancelled) return;
        setPreloadedFeedback(buildPartyFallback(me.question.question, me.question.answer ?? 'the correct answer'));
        setAiError(null);
      })
      .finally(() => {
        if (cancelled) return;
        setAiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lobby?.phase, lobby?.round, me?.question, preloadedQuestionId]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  if (lobby?.phase === 'game_over') {
    const sorted = [...lobby.players].sort((a, b) => b.score - a.score);
    return (
      <div className={styles.page}>
        <header className={styles.nav}>
          <div className={styles.brand}>
            <span className={styles.brandMark} />
            <div>
              <p className={styles.brandTag}><UserName /></p>
              <p className={styles.brandTitle}>Card Clash</p>
              <p className={styles.brandTag}>Game over</p>
            </div>
          </div>
        </header>
        <main className={styles.main}>
          <section className={styles.panel}>
            <h2>Final Standings</h2>
            <div className={styles.playerGrid}>
              {sorted.map((player, index) => (
                <div key={player.id} className={styles.playerCard}>
                  <strong>#{index + 1} {player.name}</strong>
                  <span className={styles.badge}>{player.score} pts</span>
                </div>
              ))}
            </div>
            <button className={styles.primaryBtn} type="button" onClick={handleLeaveGame}>
              Back to home
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
            <p className={styles.brandTag}><UserName /></p>
            <p className={styles.brandTitle}>Card Clash</p>
            <p className={styles.brandTag}>Party mode</p>
          </div>
        </div>
        <div className={styles.navActions}>
          <button className={styles.secondaryBtn} type="button" onClick={handleLeaveGame}>
            Leave game
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <h1 style={{ margin: 0 }}>Live Round</h1>
          {!lobby ? (
            <p className={styles.subtle}>Connecting to game...</p>
          ) : (
            <div className={styles.roundInfo}>
              <div style={{ margin: 0 }}>
                <p className={styles.subtle}>Lobby code</p>
                <p className={styles.code}>{lobby.code}</p>
              </div>
              <div style={{ margin: 0 }}>
                <p className={styles.subtle}>Round</p>
                <p className={styles.round}>{lobby.round || 1} / {lobby.maxRounds}</p>
              </div>
            </div>
          )}
        </section>

        <section className={styles.panelflex}>
          <section className={styles.panelcard}>
            <section className={styles.flexset}>
              <h2>Your card</h2>
              <p> Time left: {timeLeft ?? '-'}</p>
            </section>
            {me?.question ? (
              <div className={styles.card}>
                <p className={styles.question}>{me.question.question}</p>
                {lobby?.phase === 'results' && (
                  <>
                    <p className={styles.subtle} style={{ marginBottom: 0 }}>Answer:</p>
                    <p className={styles.subtle} style={{ marginTop: 0 }}>{me.question.answer}</p>
                  </>
                )}
              </div>
            ) : (
              <p className={styles.subtle}>No question assigned yet.</p>
            )}

            <div className={styles.actions}>
              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={requestSwap}
                disabled={!lobby || lobby.phase !== 'analyze' || me?.swapUsed || me?.wantsSwap}
              >
                Swap {me?.swapUsed ? '(used)' : ''}
              </button>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={requestLock}
                disabled={!lobby || lobby.phase !== 'analyze' || me?.lockUsed || me?.wantsLock}
              >
                Lock {me?.lockUsed ? '(used)' : ''}
              </button>
            </div>

            {lobby?.phase !== 'analyze' && (
              <>
                <h2>Choices</h2>
                <section className={styles.playerGrid}>
                  {me?.question?.options.map((option, index) => {
                    const chosen = selectedOption === option || me?.selectedAnswer === option;
                    const showResult = lobby?.phase === 'results' && chosen;
                    const correct = option === me?.question?.answer;

                    return (
                      <button
                        key={index}
                        className={styles.secondaryBtn}
                        type="button"
                        onClick={() => submitAnswer(option)}
                        disabled={!lobby || lobby.phase !== 'answer' || me?.answered || hasAnsweredLocally}
                      >
                        {option}
                        {showResult ? (correct ? ' ✓' : ' ✘') : null}
                      </button>
                    );
                  })}
                </section>
              </>
            )}
          </section>

          <section className={styles.panel}>
            <h2>AI coach</h2>
            {aiLoading && <p className={styles.subtle}>Preparing feedback...</p>}
            {!aiLoading && !aiFeedback && !aiError && (
              <p className={styles.subtle}>Your explanation will appear as soon as you answer.</p>
            )}
            {aiError && <p className={styles.aiError}>{aiError}</p>}
            {aiFeedback && <div className={styles.aiCard}>{aiFeedback}</div>}
          </section>

          <section className={styles.panel}>
            <h2>Scoreboard</h2>
            {!lobby ? (
              <p className={styles.subtle}>No players yet.</p>
            ) : (
              <div className={styles.playerGrid}>
                {lobby.players.map((player) => (
                  <div key={player.id} className={styles.playerCardScoreBoard}>
                    <strong>{player.name}</strong>
                    <span className={styles.badge}>Score: {player.score}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

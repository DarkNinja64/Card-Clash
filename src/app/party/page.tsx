'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import styles from './party.module.css';
import UserName from "@/components/UserName";
import {Socket} from "socket.io-client";
import {createClient} from "@/lib/supabase/client";

type Question = { id: string; category: string; question: string; answer: string };
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

export default function PartyPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [now, setNow] = useState<number>(Date.now());
    const [lobby, setLobby] = useState<LobbyState | null>(null);

    useEffect(() => {
        async function connect() {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;
            setSocket(getSocket(session.access_token));
        }
        connect();
    }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('lobby_update', (data) => {
            setLobby(data);
        });

        socket.on('game_update', (data) => {
            setLobby(data);
        });

        return () => {
            socket.off('lobby_update');
            socket.off('game_update');
        };
    }, [socket]);

  const submitAnswer = (correct: boolean) => {
    if (!lobby?.code || !socket) return;
    socket.emit('submit_answer', { code: lobby.code, correct });
  };

  const requestSwap = () => {
    if (!lobby?.code || !socket) return;
    socket.emit('request_swap', { code: lobby.code });
  };

  const requestLock = () => {
    if (!lobby?.code || !socket) return;
    socket.emit('request_lock', { code: lobby.code });
  };

  const nextRound = () => {
    if (!lobby?.code || !socket) return;
    socket.emit('next_round', { code: lobby.code });
  };

  const isHost = socket && lobby?.hostId === socket.id;
  const me = socket && lobby?.players.find((p) => p.id === socket.id) || null;
  const timeLeftMs = lobby?.phaseEndsAt ? Math.max(lobby.phaseEndsAt - now, 0) : null;
  const timeLeft = timeLeftMs ? Math.ceil(timeLeftMs / 1000) : null;

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
              {sorted.map((p, i) => (
                <div key={p.id} className={styles.playerCard}>
                  <strong>#{i + 1} {p.name}</strong>
                  <span className={styles.badge}>{p.score} pts</span>
                </div>
              ))}
            </div>
            <Link className={styles.primaryBtn} href="/student_home">Back to home</Link>
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
          <Link className={styles.secondaryBtn} href="/student_home">Leave game</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <h1>Live Round</h1>
          {!lobby ? (
            <p className={styles.subtle}>Join a lobby to see the game state.</p>
          ) : (
            <div className={styles.roundInfo}>
              <div>
                <p className={styles.subtle}>Lobby code</p>
                <p className={styles.code}>{lobby.code}</p>
              </div>
              <div>
                <p className={styles.subtle}>Round</p>
                <p className={styles.round}>{lobby.round || 1} / {lobby.maxRounds}</p>
              </div>
              <div>
                <p className={styles.subtle}>Phase</p>
                <p className={styles.round}>{lobby.phase}</p>
              </div>
              <div>
                <p className={styles.subtle}>Time left</p>
                <p className={styles.round}>{timeLeft ?? '-'}</p>
              </div>
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <h2>Your card</h2>
          {me?.question ? (
            <div className={styles.card}>
              <p className={styles.subtle}>{me.question.category}</p>
              <p className={styles.question}>{me.question.question}</p>
              <p className={styles.answer}>Answer: {me.question.answer}</p>
            </div>
          ) : (
            <p className={styles.subtle}>No question assigned yet.</p>
          )}
        </section>

        <section className={styles.panel}>
          <h2>Round actions</h2>
          <p className={styles.subtle}>Analyze phase is for swap/lock. Answer phase submits.</p>
          <div className={styles.actions}>
            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={requestSwap}
              disabled={!lobby || lobby.phase !== 'analyze' || me?.swapUsed || me?.wantsSwap}
            >
              Request swap {me?.swapUsed ? '(used)' : ''}
            </button>
            <button
              className={styles.ghostBtn}
              type="button"
              onClick={requestLock}
              disabled={!lobby || lobby.phase !== 'analyze' || me?.lockUsed || me?.wantsLock}
            >
              Request lock {me?.lockUsed ? '(used)' : ''}
            </button>
            <button className={styles.primaryBtn} type="button" onClick={() => submitAnswer(true)}>
              Submit correct
            </button>
            <button className={styles.secondaryBtn} type="button" onClick={() => submitAnswer(false)}>
              Submit incorrect
            </button>
            {isHost ? (
              <button className={styles.ghostBtn} type="button" onClick={nextRound}>
                Next round
              </button>
            ) : null}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Scoreboard</h2>
          {!lobby ? (
            <p className={styles.subtle}>No players yet.</p>
          ) : (
            <div className={styles.playerGrid}>
              {lobby.players.map((player) => (
                <div key={player.id} className={styles.playerCard}>
                  <strong>{player.name}</strong>
                  <span className={styles.badge}>Score: {player.score}</span>
                  {player.id === lobby.hostId ? (
                    <span className={styles.hostBadge}>Host</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

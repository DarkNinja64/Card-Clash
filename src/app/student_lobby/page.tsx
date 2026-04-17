'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import { createClient } from '@/lib/supabase/client';
import styles from './student_lobby.module.css';
import UserName from "@/components/UserName";

type Player = { id: string; name: string; score: number };

type LobbyState = {
  code: string;
  hostId: string;
  status: 'lobby' | 'in_game';
  round: number;
  phase: string;
  players: Player[];
};

export default function StudentLobbyPage() {
  const [socket, setSocket] = useState<ReturnType<typeof getSocket> | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setSocket(getSocket(session.access_token));
      }
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleLobby = (data: LobbyState) => {
      setLobby(data);
      setError(null);
      // persist the lobby code so /party can request state on mount
      if (data.code) localStorage.setItem('cc_lobby_code', data.code);
    };
    const handleError = (payload: { message: string }) => setError(payload.message);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('lobby_update', handleLobby);
    socket.on('game_update', handleLobby);
    socket.on('error_message', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('lobby_update', handleLobby);
      socket.off('game_update', handleLobby);
      socket.off('error_message', handleError);
    };
  }, [socket]);

  const joinLobby = () => {
    if (!socket || !code.trim()) return;
    socket.emit('join_lobby', { code: code.trim().toUpperCase(), name: name.trim() || 'Player' });
  };

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
              <p className={styles.brandTag}>Signed in as <UserName /></p>
            <p className={styles.brandTitle}>Card Clash</p>
            <p className={styles.brandTag}>Student lobby</p>
          </div>
        </div>
        <div className={styles.navActions}>
          <Link className={styles.secondaryBtn} href="/student_home">Back to Student Home</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <h1>Join a match</h1>
          <p className={styles.subtle}>Socket status: {connected ? 'Connected' : 'Offline'}</p>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.formRow}>
            <label>
              Display name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className={styles.input}
              />
            </label>
            <label>
              Lobby code
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="ABCDE"
                className={styles.input}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button className={styles.primaryBtn} type="button" onClick={joinLobby}>
              Join lobby
            </button>
            {lobby?.status === 'in_game' ? (
              <Link className={styles.secondaryBtn} href="/party">
                Go to game
              </Link>
            ) : null}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Lobby status</h2>
          {!lobby ? (
            <p className={styles.subtle}>Not connected to a lobby yet.</p>
          ) : (
            <>
              <div className={styles.lobbyHeader}>
                <div>
                  <p className={styles.codeLabel}>Code</p>
                  <p className={styles.code}>{lobby.code}</p>
                </div>
                <div>
                  <p className={styles.subtle}>Status</p>
                  <p className={styles.round}>{lobby.status}</p>
                </div>
              </div>
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
            </>
          )}
        </section>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import styles from './lobby.module.css';

type Player = { id: string; name: string; score: number };

type LobbyState = {
  code: string;
  hostId: string;
  status: 'lobby' | 'in_game';
  round: number;
  phase: string;
  players: Player[];
};

export default function LobbyPage() {
  const socket = useMemo(() => getSocket(), []);
  const [name, setName] = useState('');
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleLobby = (data: LobbyState) => {
      setLobby(data);
      setError(null);
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

  const createLobby = () => {
    socket.emit('create_lobby', { name: name.trim() || 'Host' });
  };

  const startGame = () => {
    if (!lobby?.code) return;
    socket.emit('start_game', { code: lobby.code });
  };

  const isHost = lobby?.hostId === socket.id;

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
            <p className={styles.brandTitle}>Card Clash</p>
            <p className={styles.brandTag}>Multiplayer lobby</p>
          </div>
        </div>
        <div className={styles.navActions}>
          <Link className={styles.secondaryBtn} href="/teacher_home">Back to Teacher</Link>
          <Link className={styles.primaryBtn} href="/student_home">Student Home</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <h1>Host a party match</h1>
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
          </div>
          <div className={styles.actions}>
            <button className={styles.primaryBtn} type="button" onClick={createLobby}>
              Create lobby
            </button>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Lobby status</h2>
          {!lobby ? (
            <p className={styles.subtle}>No lobby joined yet.</p>
          ) : (
            <>
              <div className={styles.lobbyHeader}>
                <div>
                  <p className={styles.codeLabel}>Code</p>
                  <p className={styles.code}>{lobby.code}</p>
                </div>
                <div className={styles.actions}>
                  {isHost ? (
                    <button className={styles.primaryBtn} type="button" onClick={startGame}>
                      Start game
                    </button>
                  ) : null}
                  {lobby.status === 'in_game' ? (
                    <Link className={styles.secondaryBtn} href="/party">
                      Go to game
                    </Link>
                  ) : null}
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

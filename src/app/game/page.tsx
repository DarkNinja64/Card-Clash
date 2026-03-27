'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';
import styles from './game.module.css';

type GamePhase = 'join' | 'waiting' | 'error';

interface Player {
    player_id: string;
    name: string;
}

export default function GamePage() {
    const [phase, setPhase] = useState<GamePhase>('join');
    const [displayName, setDisplayName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [myName, setMyName] = useState('');

    const socketRef = useRef<Socket | null>(null);
    const sessionRef = useRef<string>('');

    // pull the student's username from their profile
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) return;
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', session.user.id)
                .single();
            if (data?.username) setDisplayName(data.username);
        });
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    async function handleJoin() {
        if (!displayName.trim() || !joinCode.trim()) {
            setErrorMsg('Enter your name and the join code.');
            return;
        }
        setLoading(true);
        setErrorMsg('');

        try {
            const supabase = createClient();
            const { data: { session: supabaseSession } } = await supabase.auth.getSession();
            if (!supabaseSession) {
                setErrorMsg('You must be logged in to join a game.');
                setLoading(false);
                return;
            }

            const res = await fetch('http://localhost:8000/auth/student-join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseSession.access_token}`,
                },
                body: JSON.stringify({
                    display_name: displayName.trim(),
                    join_code: joinCode.trim().toUpperCase(),
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErrorMsg(body.detail ?? 'Could not join. Check your join code.');
                setLoading(false);
                return;
            }

            const data = await res.json();
            sessionRef.current = data.session_id;
            setMyName(data.display_name);

            // connect to socket.io with the student token
            const socket = io('http://localhost:8000', {
                path: '/socket.io',
                auth: { token: data.access_token },
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join_lobby', { session_id: data.session_id });
            });

            socket.on('lobby_update', (payload: { players: Player[] }) => {
                setPlayers(payload.players);
            });

            socket.on('connect_error', () => {
                setErrorMsg('Could not connect to game server.');
                setPhase('error');
            });

            setPhase('waiting');
        } catch {
            setErrorMsg('Could not reach the server.');
        }

        setLoading(false);
    }

    if (phase === 'join') {
        return (
            <div className={styles.page}>
                <main className={styles.center}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <span className={styles.brandMark} />
                            <div>
                                <h1>Join a match</h1>
                                <p>Enter the code your teacher shared</p>
                            </div>
                        </div>

                        <div className={styles.form}>
                            <label className={styles.label}>Joining as</label>
                            <p className={styles.usernameDisplay}>{displayName || 'Loading...'}</p>

                            <label className={styles.label}>Join code</label>
                            <input
                                className={styles.input}
                                placeholder="e.g. ABC123"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                maxLength={6}
                            />

                            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

                            <div className={styles.actions}>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={handleJoin}
                                    disabled={loading}
                                >
                                    {loading ? 'Joining...' : 'Join game'}
                                </button>
                                <Link className={styles.ghostBtn} href="/student_home">
                                    Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className={styles.page}>
                <main className={styles.center}>
                    <div className={styles.card}>
                        <h2>Something went wrong</h2>
                        <p className={styles.error}>{errorMsg}</p>
                        <Link className={styles.primaryBtn} href="/student_home">Go home</Link>
                    </div>
                </main>
            </div>
        );
    }

    // phase === 'waiting'
    return (
        <div className={styles.page}>
            <main className={styles.center}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <span className={styles.brandMark} />
                        <div>
                            <h1>You're in!</h1>
                            <p>Waiting for the teacher to start the game...</p>
                        </div>
                    </div>

                    <div className={styles.playerList}>
                        <h3>Players in lobby ({players.length})</h3>
                        <ul>
                            {players.map((p) => (
                                <li key={p.player_id} className={p.name === myName ? styles.me : ''}>
                                    {p.name} {p.name === myName ? '(you)' : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}

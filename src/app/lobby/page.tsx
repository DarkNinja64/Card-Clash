'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import styles from './lobby.module.css';
import {createGameSession, fetchQuestionsForGame, getTeacherToken} from './actions';
import UserName from "@/components/UserName";

type LobbyPhase = 'creating' | 'waiting' | 'error';

interface Player {
    player_id: string;
    name: string;
}



export default function LobbyPage() {
    const [phase, setPhase] = useState<LobbyPhase>('creating');
    const [joinCode, setJoinCode] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);

    const socketRef = useRef<Socket | null>(null);

    const handleStartGame = async () => {
        if (!sessionId || players.length === 0) return;
        const questions = await fetchQuestionsForGame(); // Maybe pass category?
        if (questions.length === 0) {
            setErrorMsg('No create_questions available. Add create_questions first.');
            return;
        }
        socketRef.current?.emit('start_game', { session_id: sessionId, questions });

    };

    useEffect(() => {
        let sessionIdCapture = '';

        async function setup() {
            const result = await createGameSession();
            if (!result.ok) {
                setErrorMsg(result.error);
                setPhase('error');
                return;
            }

            setJoinCode(result.join_code);
            setSessionId(result.session_id);
            sessionIdCapture = result.session_id;
            setPhase('waiting');

            // get the teacher's supabase token to authenticate the socket
            const tokenResult = await getTeacherToken();
            if (!tokenResult.token) return;

            const socket = io('http://localhost:8000', {
                path: '/socket.io',
                auth: { token: tokenResult.token },
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join_lobby', { session_id: sessionIdCapture });
            });

            socket.on('lobby_update', (payload: { players: Player[] }) => {
                setPlayers(payload.players);
            });
        }

        setup();



        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    if (phase === 'creating') {
        return (
            <div className={styles.page}>
                <header className={styles.nav}>
                    <div className={styles.brand}>
                        <p className={styles.brandTag}>Host: <UserName /></p>

                        <span className={styles.brandMark} />
                        <div>
                            <p className={styles.brandTitle}>Card Clash</p>
                            <p className={styles.brandTag}>Setting up your game...</p>
                        </div>
                    </div>
                </header>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <p className={styles.loadingText}>Creating session...</p>
                    </section>
                </main>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className={styles.page}>
                <header className={styles.nav}>
                    <div className={styles.brand}>
                        <span className={styles.brandMark} />
                        <div>
                            <p className={styles.brandTitle}>Card Clash</p>
                            <p className={styles.brandTag}>Something went wrong</p>
                        </div>
                    </div>
                    <Link className={styles.secondaryBtn} href="/teacher_home">Back</Link>
                </header>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <h2>Could not start game</h2>
                        <p className={styles.errorMsg}>{errorMsg}</p>
                        <Link className={styles.primaryBtn} href="/teacher_home">Go home</Link>
                    </section>
                </main>
            </div>
        );
    }

    // phase === 'waiting'
    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}>Waiting for players to join</p>
                    </div>
                </div>
                <Link className={styles.secondaryBtn} href="/teacher_home">Cancel</Link>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div className={styles.card}>
                        <h2>Join code</h2>
                        <p className={styles.joinCode}>{joinCode}</p>
                        <p className={styles.joinHint}>
                            Students go to <strong>Card Clash</strong> and enter this code to join.
                        </p>
                    </div>

                    <div className={styles.card}>
                        <h2>Players in lobby ({players.length})</h2>
                        {players.length === 0 ? (
                            <p className={styles.waitingMsg}>Waiting for students to join...</p>
                        ) : (
                            <ul className={styles.playerList}>
                                {players.map((p) => (
                                    <li key={p.player_id}>{p.name}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section className={styles.grid}>
                    <div className={styles.panel}>
                        <h3>Game Settings</h3>
                        <p>Mode: Individual</p>
                        <p>Rounds: 10</p>
                        <p>Time per question: 30s</p>
                    </div>
                    <div className={styles.panel}>
                        <h3>Controls</h3>
                        <button className={styles.primaryBtn} type="button" disabled={players.length === 0} onClick={handleStartGame}>
                            Start game
                        </button>
                        {players.length === 0 && (
                            <p className={styles.startHint}>Start will be enabled once players join.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';
import styles from './lobby.module.css';
import { getTeacherToken, fetchTeacherDecks } from './actions';
import UserName from "@/components/UserName";
import { createPartySocket } from '@/lib/socket';

type Question = { id: string; category: string; question: string; answer: string };
type Player = {
    id: string;
    name: string;
    score: number;
    question?: Question | null;
    answered: boolean;
    swapUsed: boolean;
    lockUsed: boolean;
    wantsSwap: boolean;
    wantsLock: boolean;
    swappedThisRound: boolean;
};

type LobbyState = {
    code: string;
    hostId: string;
    status: 'lobby' | 'in_game' | 'game_over';
    round: number;
    maxRounds: number;
    timerS: number;
    deckName?: string | null;
    phase: string;
    phaseEndsAt: number | null;
    players: Player[];
};

type PagePhase = 'connecting' | 'waiting' | 'in_game' | 'error';

export default function LobbyPage() {
    const router = useRouter();
    const [pagePhase, setPagePhase] = useState<PagePhase>('connecting');
    const [lobby, setLobby] = useState<LobbyState | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [now, setNow] = useState(() => Date.now());
    const [rounds, setRounds] = useState(5);
    const [timerSeconds, setTimerSeconds] = useState(20);
    const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<string>('');

    const socketRef = useRef<Socket | null>(null);

    // ticker for countdown display
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 500);
        return () => clearInterval(interval);
    }, []);

    // load available question categories
    useEffect(() => {
        fetchTeacherDecks().then(setDecks);
    }, []);

    useEffect(() => {
        async function setup() {
            const tokenResult = await getTeacherToken();
            if (!tokenResult.token) {
                setErrorMsg('Not logged in. Please sign in as a teacher.');
                setPagePhase('error');
                return;
            }

            const socket = createPartySocket(tokenResult.token);

            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('create_lobby', { name: 'Host' });
            });

            socket.on('lobby_update', (data: LobbyState) => {
                setLobby(data);
                setPagePhase('waiting');
            });

            socket.on('game_update', (data: LobbyState) => {
                setLobby(data);
                if (data.status === 'game_over') {
                    setPagePhase('in_game'); // stay on page to show game over state
                } else {
                    setPagePhase('in_game');
                }
            });

            socket.on('error_message', (payload: { message: string }) => {
                setErrorMsg(payload.message);
            });

            socket.on('connect_error', (error) => {
                setErrorMsg('Could not connect to game server.');
                console.error('[lobby] Connection error:', error);
                console.error('[lobby] Error message:', error.message);
                setErrorMsg(`Connection failed: ${error.message || 'Unknown error'}`);
                setPagePhase('error');
            });
        }

        setup();

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    const handleStartGame = () => {
        if (!lobby || lobby.players.length === 0) return;
        if (!selectedDeck) return;
        const deckName = decks.find((deck) => deck.id === selectedDeck)?.name ?? 'Selected Deck';
        socketRef.current?.emit('start_game', {
            code: lobby.code,
            rounds,
            timer_seconds: timerSeconds,
            deck_id: selectedDeck || null,
            deck_name: deckName,
        });
    };

    const handleNextRound = () => {
        if (!lobby) return;
        socketRef.current?.emit('next_round', { code: lobby.code });
    };

    const handleEndGame = () => {
        if (!lobby) return;
        socketRef.current?.emit('end_game', { code: lobby.code });
        socketRef.current?.disconnect();
        router.push('/teacher_home');
    };

    const handleLeave = () => {
        socketRef.current?.disconnect();
        router.push('/teacher_home');
    };

    const students = lobby?.players ?? [];
    const timeLeftMs = lobby?.phaseEndsAt ? Math.max(lobby.phaseEndsAt - now, 0) : null;
    const timeLeft = timeLeftMs !== null ? Math.ceil(timeLeftMs / 1000) : null;

    if (pagePhase === 'connecting') {
        return (
            <div className={styles.page}>
                <header className={styles.nav}>
                    <div className={styles.brand}>
                        <span className={styles.brandMark} />
                        <div>
                            <p className={styles.brandTitle}>Card Clash</p>
                            <p className={styles.brandTag}>Setting up your game...</p>
                        </div>
                    </div>
                </header>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <p className={styles.loadingText}>Connecting...</p>
                    </section>
                </main>
            </div>
        );
    }

    if (pagePhase === 'error') {
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

    if (pagePhase === 'waiting') {
        return (
            <div className={styles.page}>
                <header className={styles.nav}>
                    <div className={styles.brand}>
                        <span className={styles.brandMark} />
                        <div>
                            <p className={styles.brandTitle}>Card Clash</p>
                            <p className={styles.brandTag}>Host: <UserName /></p>
                        </div>
                    </div>
                    <button className={styles.secondaryBtn} type="button" onClick={handleLeave}>
                        Cancel
                    </button>
                </header>

                <main className={styles.main}>
                    <section className={styles.hero}>
                        <div className={styles.card}>
                            <h2>Join code</h2>
                            <p className={styles.joinCode}>{lobby?.code}</p>
                            <p className={styles.joinHint}>
                                Students go to <strong>Card Clash</strong> and enter this code to join.
                            </p>
                        </div>

                        <div className={styles.card}>
                            <h2>Players in lobby ({students.length})</h2>
                            {students.length === 0 ? (
                                <p className={styles.waitingMsg}>Waiting for students to join...</p>
                            ) : (
                                <ul className={styles.playerList}>
                                    {students.map((p) => (
                                        <li key={p.id}>{p.name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    <section className={styles.grid}>
                        <div className={styles.panel}>
                            <h3>Game Settings</h3>
                            <label className={styles.settingRow}>
                                <span>Deck</span>
                                <select
                                    className={styles.select}
                                    value={selectedDeck}
                                    onChange={(e) => setSelectedDeck(e.target.value)}
                                >
                                    <option value="">Select a deck...</option>
                                    {decks.map((deck) => (
                                        <option key={deck.id} value={deck.id}>{deck.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className={styles.settingRow}>
                                <span>Rounds: <strong>{rounds}</strong></span>
                                <input
                                    type="range"
                                    min={1}
                                    max={20}
                                    value={rounds}
                                    onChange={(e) => setRounds(Number(e.target.value))}
                                    className={styles.slider}
                                />
                            </label>
                            <label className={styles.settingRow}>
                                <span>Timer: <strong>{timerSeconds}s</strong> per phase</span>
                                <input
                                    type="range"
                                    min={10}
                                    max={60}
                                    step={5}
                                    value={timerSeconds}
                                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                                    className={styles.slider}
                                />
                            </label>
                        </div>
                        <div className={styles.panel}>
                            <h3>Controls</h3>
                            <button
                                className={styles.primaryBtn}
                                type="button"
                                disabled={students.length === 0 || !selectedDeck}
                                onClick={handleStartGame}
                            >
                                Start game
                            </button>
                            {students.length === 0 && (
                                <p className={styles.startHint}>Start will be enabled once players join.</p>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    // pagePhase === 'in_game'
    const answered = lobby?.players.filter(p => p.answered).length ?? 0;
    const total = lobby?.players.length ?? 0;
    const isGameOver = lobby?.status === 'game_over';

    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}>
                            {isGameOver ? 'Game over' : `Round ${lobby?.round} of ${lobby?.maxRounds} · ${lobby?.phase}`}
                        </p>
                        {lobby?.deckName ? (
                            <p className={styles.brandTag}>Deck: {lobby.deckName}</p>
                        ) : null}
                    </div>
                </div>
                <div className={styles.navActions}>
                    {timeLeft !== null && !isGameOver && (
                        <p className={styles.timer}>{timeLeft}s</p>
                    )}
                    <button className={styles.secondaryBtn} type="button" onClick={handleEndGame}>
                        End game
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                <section className={styles.grid}>
                    <div className={styles.panel}>
                        <h3>Players — {answered} / {total} answered</h3>
                        <ul className={styles.playerList}>
                            {lobby?.players.map((p) => (
                                <li key={p.id}>
                                    {p.answered ? '✓' : '·'} {p.name}
                                    {p.wantsSwap && ' (swap)'}
                                    {p.wantsLock && ' (lock)'}
                                    {lobby?.phase === 'results' && typeof p.answered === 'boolean' && (
                                        <>
                                            {' '}
                                            — {p.score} pts
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.panel}>
                        <h3>Standings</h3>
                        <ul className={styles.playerList}>
                            {[...(lobby?.players ?? [])]
                                .sort((a, b) => b.score - a.score)
                                .map((p, index) => (
                                    <li key={p.id}>
                                        #{index + 1} {p.name} — {p.score} pts
                                    </li>
                                ))}
                        </ul>
                    </div>

                    <div className={styles.panel}>
                        <h3>Controls</h3>
                        {isGameOver ? (
                            <button className={styles.primaryBtn} type="button" onClick={handleLeave}>
                                Back to home
                            </button>
                        ) : (
                            <>
                                <button
                                    className={styles.primaryBtn}
                                    type="button"
                                    disabled={lobby?.phase !== 'results'}
                                    onClick={handleNextRound}
                                >
                                    Next round
                                </button>
                                {lobby?.phase !== 'results' && (
                                    <p className={styles.startHint}>Available after results phase.</p>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

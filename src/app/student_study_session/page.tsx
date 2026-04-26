'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './student_study_session.module.css';
import {
    fetchDecksForStudySession,
    fetchQuestionsForStudySession,
    type StudyDeck,
    type StudyQuestion,
} from './actions';

const MOCK_QUESTIONS: StudyQuestion[] = [
    {
        id: '1',
        text: 'What is the capital of France?',
        type: 'mc',
        options: [{ text: 'London' }, { text: 'Berlin' }, { text: 'Paris' }, { text: 'Madrid' }],
        timer_seconds: 10,
        correct_answer: 'paris',
    },
    {
        id: '2',
        text: 'What is 7 × 8?',
        type: 'mc',
        options: [{ text: '54' }, { text: '56' }, { text: '58' }, { text: '60' }],
        timer_seconds: 10,
        correct_answer: '56',
    },
    {
        id: '3',
        text: 'Which planet is known as the Red Planet?',
        type: 'mc',
        options: [{ text: 'Venus' }, { text: 'Mars' }, { text: 'Jupiter' }, { text: 'Saturn' }],
        timer_seconds: 10,
        correct_answer: 'mars',
    },
];

type GamePhase = 'category_select' | 'ready' | 'question' | 'result' | 'game_over';
type PreloadedFeedback = {
    correct: string;
    incorrect: string;
};

export default function StudyPage() {
    const [phase, setPhase] = useState<GamePhase>('category_select');
    const [decks, setDecks] = useState<StudyDeck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<StudyDeck | null>(null);
    const [questions, setQuestions] = useState<StudyQuestion[]>([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [preloadedFeedback, setPreloadedFeedback] = useState<PreloadedFeedback | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [timeStarted, setTimeStarted] = useState<number | null>(null);
    const [loadingDecks, setLoadingDecks] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [decksError, setDecksError] = useState(false);

    const question = questions[currentRound];
    const totalRounds = questions.length;

    // Fetch study decks on mount
    useEffect(() => {
        fetchDecksForStudySession()
            .then(setDecks)
            .catch(() => setDecksError(true))
            .finally(() => setLoadingDecks(false));
    }, []);

    const handleDeckSelect = useCallback((deck: StudyDeck) => {
        setSelectedDeck(deck);
        setLoadingQuestions(true);
        setPhase('category_select');
        fetchQuestionsForStudySession(deck.id)
            .then((data) => {
                if (data.length > 0) {
                    setQuestions(data);
                    setPhase('ready');
                } else {
                    setQuestions(MOCK_QUESTIONS);
                    setPhase('ready');
                }
            })
            .catch(() => {
                setQuestions(MOCK_QUESTIONS);
                setPhase('ready');
            })
            .finally(() => setLoadingQuestions(false));
    }, []);

    useEffect(() => {
        if (phase !== 'question' || !question || selectedAnswer) return;
        if (timer <= 0) {
            handleAnswer('');
            return;
        }
        const id = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [phase, question, timer, selectedAnswer]);

    useEffect(() => {
        if (phase !== 'question' || !question) return;

        let cancelled = false;
        setAiLoading(true);
        setAiError(null);
        setAiFeedback(null);
        setPreloadedFeedback(null);

        fetch('/api/study-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question.text,
                correctAnswer: question.correct_answer,
                preload: true,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setPreloadedFeedback(data?.preloaded || null);
            })
            .catch(() => {
                if (cancelled) return;
                setAiError('AI feedback unavailable.');
            })
            .finally(() => {
                if (cancelled) return;
                setAiLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [phase, question]);

    const handleAnswer = useCallback(
        (answer: string) => {
            if (selectedAnswer || !question) return;
            setSelectedAnswer(answer);
            const given = answer.trim().toLowerCase();
            const correct = question.correct_answer.trim().toLowerCase();
            const isCorrect = given === correct;

            if (isCorrect) {
                setCorrectCount((c) => c + 1);
            }

            const timeElapsed = timeStarted ? Date.now() - timeStarted : question.timer_seconds * 1000;
            const timeMs = Math.min(timeElapsed, question.timer_seconds * 1000);
            const timerMs = question.timer_seconds * 1000;
            const speedBonus = timerMs > 0 ? Math.max(0, Math.floor(50 * (1 - timeMs / timerMs))) : 0;
            const points = isCorrect ? 100 + speedBonus : 0;
            setScore((s) => s + points);
            setLastResult({ isCorrect, points });
            setPhase('result');

            if (preloadedFeedback) {
                setAiFeedback(isCorrect ? preloadedFeedback.correct : preloadedFeedback.incorrect);
                setAiLoading(false);
                return;
            }

            setAiLoading(true);
            setAiFeedback(null);
            setAiError(null);
            fetch('/api/study-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question.text,
                    correctAnswer: question.correct_answer,
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
        },
        [preloadedFeedback, question, selectedAnswer, timeStarted]
    );

    const startGame = () => {
        setPhase('question');
        setCurrentRound(0);
        setCorrectCount(0)
        setScore(0);
        setLastResult(null);
        setSelectedAnswer(null);
        setAiFeedback(null);
        setAiError(null);
        setPreloadedFeedback(null);
        setAiLoading(false);
        const q = questions[0];
        setTimer(q?.timer_seconds ?? 10);
        setTimeStarted(Date.now());
    };

    const nextRound = () => {
        setLastResult(null);
        setSelectedAnswer(null);
        setAiFeedback(null);
        setAiError(null);
        setPreloadedFeedback(null);
        if (currentRound + 1 >= totalRounds) {
            setPhase('game_over');
            return;
        }
        setCurrentRound((r) => r + 1);
        const q = questions[currentRound + 1];
        setTimer(q?.timer_seconds ?? 10);
        setTimeStarted(Date.now());
        setPhase('question');
    };

    const chooseDifferentDeck = () => {
        setPhase('category_select');
        setSelectedDeck(null);
        setQuestions([]);
    };

    const playAgain = () => {
        setPhase('ready');
        setCurrentRound(0);
        setCorrectCount(0)
        setScore(0);
        setSelectedAnswer(null);
        setLastResult(null);
        setAiFeedback(null);
        setPreloadedFeedback(null);
        setAiError(null);
        setAiLoading(false);
        setTimeStarted(null);
    };

    // Category selection screen
    if (phase === 'category_select') {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <Link className={styles.secondaryBtn} href="/student_home">Back</Link>
                </header>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <h1>Solo Study</h1>
                        <p>Choose a study set to practice:</p>
                        {loadingDecks ? (
                            <p>Loading decks...</p>
                        ) : decksError || decks.length === 0 ? (
                            <>
                                <p className={styles.fallbackMsg}>
                                    {decksError ? 'Could not load study decks. Using practice set.' : 'No study decks available yet.'}
                                </p>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={() => {
                                        setQuestions(MOCK_QUESTIONS);
                                        setPhase('ready');
                                    }}
                                >
                                    Use practice questions
                                </button>
                            </>
                        ) : (
                            <div className={styles.categoryList}>
                                {decks.map((deck) => (
                                    <button
                                        key={deck.id}
                                        className={styles.categoryBtn}
                                        onClick={() => handleDeckSelect(deck)}
                                        disabled={loadingQuestions}
                                    >
                                        <strong>{deck.name}</strong>
                                        {deck.courseName ? ` - ${deck.courseName}` : ''}
                                    </button>
                                ))}
                            </div>
                        )}
                        {loadingQuestions && <p>Loading questions...</p>}
                    </section>
                </main>
            </div>
        );
    }

    // Ready to start (after deck chosen)
    if (phase === 'ready') {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <Link className={styles.secondaryBtn} href="/student_home">Back</Link>
                </header>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <h1>Solo Study</h1>
                        {selectedDeck && <p className={styles.categoryLabel}>Deck: {selectedDeck.name}</p>}
                        <p>Practice with {totalRounds} questions. Answer quickly for bonus points.</p>
                        <button className={styles.primaryBtn} onClick={startGame}>
                            Start game
                        </button>
                        <button className={styles.ghostBtn} onClick={chooseDifferentDeck} style={{ marginTop: 12 }}>
                            Choose different deck
                        </button>
                    </section>
                </main>
            </div>
        );
    }

    if (phase === 'game_over') {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <button className={styles.secondaryBtn} onClick={playAgain}>Play again</button>
                    <Link className={styles.primaryBtn} href="/student_home">Home</Link>
                </header>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <h1>Game over</h1>
                        <p>Questions answered correctly: {correctCount} / {totalRounds}</p>
                            <p>{correctCount} * 100 = {correctCount * 100} points</p>
                        <p>+ total speed bonus points: {score - (correctCount * 100)}</p>
                            <p className={styles.finalScore}>Final score: {score}</p>

                            {selectedDeck && <p>Deck: {selectedDeck.name}</p>}
                    </section>
                </main>
            </div>
        );
    }

    if (phase === 'result') {
        return (
            <div className={styles.page}>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <h2>Round {currentRound + 1} of {totalRounds}</h2>
                        <p className={lastResult?.isCorrect ? styles.correct : styles.wrong}>
                            {lastResult?.isCorrect ? 'Correct' : 'Wrong'}
                            {lastResult ? ` (+${lastResult.points} pts)` : ''}
                        </p>
                        <p>Score: {score}</p>
                        <div className={styles.aiBox}>
                            <h3>Study feedback</h3>
                            {aiLoading && <p className={styles.subtle}>Generating feedback...</p>}
                            {aiError && <p className={styles.aiError}>{aiError}</p>}
                            {aiFeedback && <p className={styles.aiText}>{aiFeedback}</p>}
                        </div>
                        <button className={styles.primaryBtn} onClick={nextRound}>
                            {currentRound + 1 >= totalRounds ? 'See results' : 'Next question'}
                        </button>
                    </section>
                </main>
            </div>
        );
    }

    // phase === 'question'
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <span>Round {currentRound + 1} / {totalRounds}</span>
                <span className={styles.timer}>{timer}s</span>
                <span>Score: {score}</span>
            </header>
            <main className={styles.main}>
                <section className={styles.card}>
                    <h2>{question?.text}</h2>
                    <div className={styles.options}>
                        {question?.options.map((opt) => (
                            <button
                                key={opt.text}
                                className={styles.optionBtn}
                                onClick={() => handleAnswer(opt.text)}
                                disabled={!!selectedAnswer}
                            >
                                {opt.text}
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

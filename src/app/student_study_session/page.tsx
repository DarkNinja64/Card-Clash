'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './student_study_session.module.css';
import {
    fetchCategoriesForStudySession,
    fetchQuestionsForStudySession,
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

export default function StudyPage() {
    const [phase, setPhase] = useState<GamePhase>('category_select');
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [questions, setQuestions] = useState<StudyQuestion[]>([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
    const [timeStarted, setTimeStarted] = useState<number | null>(null);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [categoriesError, setCategoriesError] = useState(false);

    const question = questions[currentRound];
    const totalRounds = questions.length;

    // Fetch categories on mount
    useEffect(() => {
        fetchCategoriesForStudySession()
            .then(setCategories)
            .catch(() => setCategoriesError(true))
            .finally(() => setLoadingCategories(false));
    }, []);

    const handleCategorySelect = useCallback((category: string) => {
        setSelectedCategory(category);
        setLoadingQuestions(true);
        setPhase('category_select'); // keep showing category UI while loading
        fetchQuestionsForStudySession(category)
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
        },
        [question, selectedAnswer, timeStarted]
    );

    const startGame = () => {
        setPhase('question');
        setCurrentRound(0);
        setCorrectCount(0)
        setScore(0);
        setLastResult(null);
        setSelectedAnswer(null);
        const q = questions[0];
        setTimer(q?.timer_seconds ?? 10);
        setTimeStarted(Date.now());
    };

    const nextRound = () => {
        setLastResult(null);
        setSelectedAnswer(null);
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

    const chooseDifferentCategory = () => {
        setPhase('category_select');
        setSelectedCategory(null);
        setQuestions([]);
    };

    const playAgain = () => {
        setPhase('ready');
        setCurrentRound(0);
        setCorrectCount(0)
        setScore(0);
        setSelectedAnswer(null);
        setLastResult(null);
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
                        <p>Choose a category to practice:</p>
                        {loadingCategories ? (
                            <p>Loading categories...</p>
                        ) : categoriesError || categories.length === 0 ? (
                            <>
                                <p className={styles.fallbackMsg}>
                                    {categoriesError ? 'Could not load categories. Using practice set.' : 'No categories yet.'}
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
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        className={styles.categoryBtn}
                                        onClick={() => handleCategorySelect(cat)}
                                        disabled={loadingQuestions}
                                    >
                                        {cat}
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

    // Ready to start (after category chosen)
    if (phase === 'ready') {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <Link className={styles.secondaryBtn} href="/student_home">Back</Link>
                </header>
                <main className={styles.main}>
                    <section className={styles.card}>
                        <h1>Solo Study</h1>
                        {selectedCategory && <p className={styles.categoryLabel}>Category: {selectedCategory}</p>}
                        <p>Practice with {totalRounds} questions. Answer quickly for bonus points.</p>
                        <button className={styles.primaryBtn} onClick={startGame}>
                            Start game
                        </button>
                        <button className={styles.ghostBtn} onClick={chooseDifferentCategory} style={{ marginTop: 12 }}>
                            Choose different category
                        </button>
                    </section>
                </main>
            </   div>
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

                            {selectedCategory && <p>Category: {selectedCategory}</p>}
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
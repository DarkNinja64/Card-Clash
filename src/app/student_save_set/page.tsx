'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../student_study_session/student_study_session.module.css';

export default function SaveDeckPage() {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function handleSave() {
        if (code.length < 6) return;
        setStatus('loading');
        setMessage('');

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setStatus('error');
            setMessage('You must be logged in to save a deck.');
            return;
        }

        // Look up deck by share code
        const { data: deck, error: deckError } = await supabase
            .from('decks')
            .select('id, name')
            .eq('share_code', code.trim())
            .single();

        if (deckError || !deck) {
            setStatus('error');
            setMessage('No deck with that code was found.');
            return;
        }

        // Save it to the student's saved decks
        const { error: saveError } = await supabase
            .from('student_saved_decks')
            .insert({ student_id: user.id, deck_id: deck.id });

        if (saveError) {
            if (saveError.code === '23505') {
                setStatus('error');
                setMessage(`You already saved "${deck.name}".`);
            } else {
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
            }
            return;
        }

        setStatus('success');
        setMessage(`"${deck.name}" has been saved to your decks!`);
        setCode('');
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link className={styles.secondaryBtn} href="/student_home">← Back</Link>
            </header>
            <main className={styles.main}>
                <section className={styles.card}>
                    <h1>Save a Deck</h1>
                    <p>Enter the 6-digit code your teacher gave you.</p>

                    <input
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        placeholder="e.g. 847392"
                        style={{
                            display: 'block',
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            fontSize: '1.5rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.3em',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: '1px solid rgba(247,243,255,0.2)',
                            background: 'rgba(247,243,255,0.08)',
                            color: 'inherit',
                            outline: 'none',
                        }}
                    />

                    <button
                        className={styles.primaryBtn}
                        onClick={handleSave}
                        disabled={status === 'loading' || code.length < 6}
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        {status === 'loading' ? 'Saving...' : 'Save Deck'}
                    </button>

                    {status === 'success' && (
                        <p style={{ marginTop: '1rem', color: '#4ade80', textAlign: 'center' }}>
                            ✓ {message}
                        </p>
                    )}
                    {status === 'error' && (
                        <p style={{ marginTop: '1rem', color: '#f87171', textAlign: 'center' }}>
                            {message}
                        </p>
                    )}

                </section>
            </main>
        </div>
    );
}
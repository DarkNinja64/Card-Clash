'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../teacher_home/teacher_home.module.css';
import Link from 'next/link';
import UserName from '@/components/UserName';

function RemoveDeckButton({ savedDeckId, onRemoved }: { savedDeckId: string, onRemoved: () => void }) {
    const [loading, setLoading] = useState(false);

    async function handleRemove() {
        if (!confirm('Remove this deck from your saved decks?')) return;
        setLoading(true);
        const supabase = createClient();
        await supabase
            .from('student_saved_decks')
            .delete()
            .eq('id', savedDeckId);
        onRemoved(); // update parent state instantly
        setLoading(false);
    }

    return (
      <button
        className={styles.secondaryBtn}
        onClick={handleRemove}
        disabled={loading}
        style={{ opacity: loading ? 0.5 : 1 }}>
        {loading ? 'Removing...' : 'Remove'}
      </button>
    );
}

type SavedDeckRow = {
    id: string;
    saved_at: string | null;
    decks: {
        id: string;
        name: string;
        share_code: string | null;
    } | null;
};

export default function StudentSavedDecksPage() {
    const [savedDecks, setSavedDecks] = useState<SavedDeckRow[]>([]);
    const [loading, setLoading] = useState(true);

    function handleRemoved(id: string) {
      setSavedDecks(prev => prev.filter(row => row.id !== id));
    } 

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/student_login';
                return;
            }
            const { data } = await supabase
                .from('student_saved_decks')
                .select(`
                    id,
                    saved_at,
                    decks (
                        id,
                        name,
                        share_code
                    )
                `)
                .eq('student_id', user.id)
                .order('saved_at', { ascending: false });

            setSavedDecks((data as SavedDeckRow[]) ?? []);
            setLoading(false);
        }
        load();
    }, []);

    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}><UserName /></p>
                    </div>
                </div>
                <a className={styles.secondaryBtn} href="/student_home">← Back</a>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div>
                        <h1>My Saved Decks</h1>
                        <p>Decks you've saved from your teachers. Use them to study anytime.</p>
                    </div>
                    <Link className={styles.primaryBtn} href="/student_save_deck">
                        + Save a New Deck
                    </Link>
                </section>

                {loading ? (
                    <div className={styles.panel}>
                        <p style={{ color: 'rgba(247,243,255,0.6)' }}>Loading...</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {savedDecks.length > 0 ? (
                            savedDecks.map((row) => {
                                const deck = row.decks;
                                if (!deck) return null;
                                return (
                                    <div key={row.id} className={styles.panel}>
                                        <h3>{deck.name}</h3>
                                        <p style={{ color: 'rgba(247,243,255,0.6)', fontSize: '0.85rem' }}>
                                            Saved {row.saved_at
                                                ? new Date(row.saved_at).toLocaleDateString()
                                                : ''}
                                        </p>

                                        <p style={{ marginTop: '0.5rem' }}>
                                            <span style={{ color: 'rgba(247,243,255,0.6)', fontSize: '0.8rem' }}>
                                                Deck code:{' '}
                                            </span>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.15em',
                                                background: 'rgba(247,243,255,0.12)',
                                                border: '1px solid rgba(247,243,255,0.2)',
                                                borderRadius: '6px',
                                                padding: '2px 10px',
                                                color: 'rgba(247,243,255,0.95)',
                                            }}>
                                                {deck.share_code}
                                            </span>
                                        </p>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                            <Link
                                                className={styles.ghostBtn}
                                                href="/student_study_session"
                                            >
                                                Study →
                                            </Link>
                                            <RemoveDeckButton savedDeckId={row.id} onRemoved={() => handleRemoved(row.id)} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.panel}>
                                <p style={{ color: 'rgba(247,243,255,0.6)' }}>
                                    No saved decks yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
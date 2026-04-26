'use client';

import { useActionState } from 'react';
import styles from '../teacher_home/teacher_home.module.css';
import { createDeck } from '@/app/teacher_courses/actions';

export default function CreateDeckForm() {
    const [state, formAction] = useActionState(createDeck, {});

    return (
        <div className={styles.panel}>
            <h3>New Deck</h3>
            <form action={formAction}>
                <input
                    name="name"
                    type="text"
                    placeholder="Deck name"
                    required
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.07)',
                        color: '#f7f3ff',
                        marginBottom: '10px'
                    }}
                />
                {state?.error && (
                    <p style={{ color: '#ff6f3c', fontSize: '0.85rem', marginBottom: '8px' }}>
                        {state.error}
                    </p>
                )}
                {state?.success && (
                    <p style={{ color: '#2ee6d6', fontSize: '0.85rem', marginBottom: '8px' }}>
                        Deck created!
                    </p>
                )}
                <button className={styles.primaryBtn} type="submit">
                    Create Deck
                </button>
            </form>
        </div>
    );
}

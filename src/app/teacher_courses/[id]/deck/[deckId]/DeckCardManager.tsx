'use client';

import { useState, useEffect, useActionState } from 'react';
import styles from '../../../../teacher_home/teacher_home.module.css';
import { updateDeckCard, removeDeckCard } from './actions';

type Answer = { id: string; answer_text: string; is_correct: boolean };
type DeckCard = { id: string; question_id: string; question_text: string; answers: Answer[] };

export default function DeckCardManager({
                                            deckCards,
                                            courseId,
                                            deckId,
                                        }: {
    deckCards: DeckCard[];
    courseId: string;
    deckId: string;
}) {
    const [selected, setSelected] = useState<DeckCard | null>(null);
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [updateState, updateAction] = useActionState(updateDeckCard, {});
    const [removeState, removeAction] = useActionState(removeDeckCard, {});

    useEffect(() => {
        if (updateState.success) {
            setTimeout(() => {
                setMode('view');
                setSelected(null);
            }, 0);
        }
    }, [updateState.success]);

    useEffect(() => {
        if (removeState.success) {
            setTimeout(() => setSelected(null), 0);
        }
    }, [removeState.success]);

    // Sync selected with refreshed props
    useEffect(() => {
        if (selected) {
            const updated = deckCards.find((c) => c.id === selected.id);
            if (updated) setTimeout(() => setSelected(updated), 0);
        }
    }, [deckCards]);

    return (
        <>
            {/* Deck card list */}
            <div className={styles.panel}>
                <h3>Questions in deck ({deckCards.length})</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                    {deckCards.length === 0 && (
                        <p style={{ color: 'rgba(247,243,255,0.5)' }}>No questions yet.</p>
                    )}
                    {deckCards.map((card) => (
                        <div
                            key={card.id}
                            onClick={() => { setSelected(card); setMode('view'); }}
                            style={{
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '10px',
                                background: selected?.id === card.id
                                    ? 'rgba(156,91,255,0.25)'
                                    : 'rgba(255,255,255,0.05)',
                                border: selected?.id === card.id
                                    ? '1px solid rgba(156,91,255,0.6)'
                                    : '1px solid transparent',
                            }}
                        >
                            <p style={{ color: card.question_text === 'empty' ? '#ff6f3c' : '#f7f3ff', margin: 0 }}>
                                {card.question_text === 'empty' ? '⚠ No content set' : card.question_text}
                            </p>
                            {card.answers.length === 0 && (
                                <p style={{ color: '#ff6f3c', fontSize: '0.75rem', margin: '4px 0 0' }}>
                                    ⚠ No answer options — cannot be used in a game
                                </p>
                            )}

                        </div>
                    ))}
                </div>
            </div>

            {/* Detail panel */}
            {selected && (
                <div className={styles.panel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>{mode === 'view' ? 'Card details' : 'Edit card'}</h3>
                        <button
                            className={styles.ghostBtn}
                            type="button"
                            onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                        >
                            {mode === 'view' ? 'Edit' : 'Cancel'}
                        </button>
                    </div>

                    {mode === 'view' ? (
                        <>
                            <label style={{ color: 'rgba(247,243,255,0.7)', fontSize: '0.85rem' }}>Question</label>
                            <p style={{ color: '#f7f3ff', lineHeight: 1.6 }}>{selected.question_text}</p>

                            <label style={{ color: 'rgba(247,243,255,0.7)', fontSize: '0.85rem' }}>Answer options</label>
                            <ul style={{ paddingLeft: '18px', color: 'rgba(247,243,255,0.8)', lineHeight: 1.8 }}>
                                {selected.answers.map((a) => (
                                    <li key={a.id}>{a.answer_text} {a.is_correct ? '✓' : ''}</li>
                                ))}
                            </ul>

                            {/* Remove form */}
                            <form action={removeAction}>
                                <input type="hidden" name="deckCardId" value={selected.id} />
                                <input type="hidden" name="courseId" value={courseId} />
                                <input type="hidden" name="deckId" value={deckId} />
                                {removeState.error && (
                                    <p style={{ color: '#ff6f3c', fontSize: '0.85rem' }}>{removeState.error}</p>
                                )}
                                <button type="submit" className={styles.secondaryBtn}>
                                    Remove from deck
                                </button>
                            </form>
                        </>
                    ) : (
                        <form key={selected.id} action={updateAction}>
                            <input type="hidden" name="deckCardId" value={selected.id} />
                            <input type="hidden" name="courseId" value={courseId} />
                            <input type="hidden" name="deckId" value={deckId} />

                            <label style={{ color: 'rgba(247,243,255,0.7)', fontSize: '0.85rem' }}>Question</label>
                            <textarea
                                name="question_text"
                                className={styles.textarea ?? ''}
                                defaultValue={selected.question_text}
                                required
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.07)', color: '#f7f3ff',
                                    minHeight: '80px', marginBottom: '10px', resize: 'vertical'
                                }}
                            />

                            <label style={{ color: 'rgba(247,243,255,0.7)', fontSize: '0.85rem' }}>Answer options</label>
                            {['1', '2', '3', '4'].map((n, index) => {
                                const existing = selected.answers[index];
                                return (
                                    <div key={n} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ width: '28px', height: '28px', borderRadius: '999px', background: 'rgba(255,207,92,0.2)', color: '#ffcf5c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                            {index + 1}
                                        </span>
                                        <input
                                            name={`answer_text_${n}`}
                                            defaultValue={existing?.answer_text ?? ''}
                                            placeholder={`Option ${String.fromCharCode(64 + index + 1)}`}
                                            type="text"
                                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#f7f3ff' }}
                                        />
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'rgba(247,243,255,0.7)' }}>
                                            <input
                                                type="radio"
                                                name="correct_answer"
                                                value={n}
                                                defaultChecked={existing?.is_correct ?? false}
                                                required
                                            /> Correct
                                        </label>
                                    </div>
                                );
                            })}

                            {updateState.error && (
                                <p style={{ color: '#ff6f3c', fontSize: '0.85rem' }}>{updateState.error}</p>
                            )}
                            <button type="submit" className={styles.primaryBtn}>
                                Save changes
                            </button>
                        </form>
                    )}
                </div>
            )}
        </>
    );
}
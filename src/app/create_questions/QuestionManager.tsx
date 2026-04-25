'use client';

import { useState, useEffect, useActionState } from 'react';
import styles from './questions.module.css';
import { createQuestion, updateQuestion } from './actions';

type AnswerOption = { id: string; answer_text: string; is_correct: boolean };
type Question = {
    id: string;
    question_text: string;
    answer_options: AnswerOption[];
    question_tags: { tag_id: string }[];
};
type Tag = { id: string; name: string };

export default function QuestionManager({
                                            questions,
                                            tags,
                                        }: {
    questions: Question[];
    tags: Tag[];
}) {
    const [selected, setSelected] = useState<Question | null>(null);
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [createState, createAction] = useActionState(createQuestion, {});
    const [updateState, updateAction] = useActionState(updateQuestion, {});

    // Switch to view mode immediately after a successful save
    useEffect(() =>
    {
        if (updateState.success)
        {
            setTimeout(() =>
            {
                setMode('view');
                setSelected(null);
            }, 0);
        }
    }, [updateState.success]);


    const handleSelect = (q: Question) => {
        setSelected(q);
        setMode('view');
    };

    const handleNewQuestion = () => {
        setSelected(null);
        setMode('view');
    };

    const selectedTagIds = new Set(selected?.question_tags.map((qt) => qt.tag_id) ?? []);

    return (
        <>
            {/* Question list */}
            <section className={styles.formCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Questions ({questions.length})</h2>
                    <button className={styles.ghostBtn} type="button" onClick={handleNewQuestion}>
                        + New
                    </button>
                </div>
                <div className={styles.scrollContainer}>
                    {questions.length === 0 && (
                        <p style={{ color: 'rgba(247,243,255,0.5)' }}>No questions yet.</p>
                    )}
                    {questions.map((q) => (
                        <article
                            key={q.id}
                            onClick={() => handleSelect(q)}
                            style={{
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '10px',
                                marginBottom: '8px',
                                background: selected?.id === q.id
                                    ? 'rgba(156,91,255,0.25)'
                                    : 'rgba(255,255,255,0.05)',
                                border: selected?.id === q.id
                                    ? '1px solid rgba(156,91,255,0.6)'
                                    : '1px solid transparent',
                            }}
                        >
                            <p style={{ color: '#f7f3ff', margin: 0 }}>{q.question_text}</p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Detail panel */}
            {selected ? (
                <section className={styles.formCard}>

                    {/* Mode toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>{mode === 'view' ? 'Question details' : 'Edit question'}</h2>
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
                            <label className={styles.label}>Question prompt</label>
                            <p style={{ color: '#f7f3ff', lineHeight: 1.6 }}>{selected.question_text}</p>

                            <label className={styles.label}>Answer options</label>
                            <ul style={{ paddingLeft: '18px', color: 'rgba(247,243,255,0.8)', lineHeight: 1.8 }}>
                                {selected.answer_options.map((opt) => (
                                    <li key={opt.id}>
                                        {opt.answer_text} {opt.is_correct ? '✓' : ''}
                                    </li>
                                ))}
                            </ul>

                            <label className={styles.label}>Tags</label>
                            <div className={styles.optionList}>
                                {tags.map((tag) => (
                                    <label key={tag.id} className={styles.checkLabel}>
                                        <input
                                            type="checkbox"
                                            checked={selectedTagIds.has(tag.id)}
                                            readOnly
                                        />
                                        {tag.name}
                                    </label>
                                ))}
                            </div>
                        </>
                    ) : (
                        // key forces form to remount when selected question changes
                        <form key={selected.id} action={updateAction}>
                            <input type="hidden" name="question_id" value={selected.id} />

                            <label className={styles.label} htmlFor="edit-question-text">
                                Question prompt
                            </label>
                            <textarea
                                id="edit-question-text"
                                name="question_text"
                                className={styles.textarea}
                                defaultValue={selected.question_text}
                                required
                            />

                            <section className={styles.formCard}>
                                <h2>Answer options</h2>
                                <div className={styles.optionList}>
                                    {['1', '2', '3', '4'].map((n, index) => {
                                        const existing = selected.answer_options[index];
                                        return (
                                            <div key={n} className={styles.optionRow}>
                                                <span className={styles.optionBadge}>{index + 1}</span>
                                                <input
                                                    name={`answer_option_${n}`}
                                                    className={styles.input}
                                                    placeholder={`Option ${String.fromCharCode(64 + index + 1)}`}
                                                    defaultValue={existing?.answer_text ?? ''}
                                                    type="text"
                                                />
                                                <label className={styles.checkLabel}>
                                                    <input
                                                        type="radio"
                                                        name="correct_answer_option"
                                                        value={n}
                                                        defaultChecked={existing?.is_correct ?? false}
                                                        required
                                                    /> Correct
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className={styles.formCard}>
                                <h2>Tags</h2>
                                <div className={styles.optionList}>
                                    {tags.map((tag) => (
                                        <label key={tag.id} className={styles.checkLabel}>
                                            <input
                                                type="checkbox"
                                                name="tag_ids"
                                                value={tag.id}
                                                defaultChecked={selectedTagIds.has(tag.id)}
                                            />
                                            {tag.name}
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {updateState.error && (
                                <p style={{ color: '#ff6f3c', fontSize: '0.85rem' }}>{updateState.error}</p>
                            )}
                            {updateState.success && (
                                <p style={{ color: '#2ee6d6', fontSize: '0.85rem' }}>Saved!</p>
                            )}

                            <button type="submit" className={styles.primaryBtn}>
                                Save changes
                            </button>
                        </form>
                    )}
                </section>
            ) : (
                /* Create form — shown when nothing is selected */
                <form action={createAction}>
                    <section className={styles.formCard}>
                        <h2>New question</h2>

                        <label className={styles.label} htmlFor="question-text">Question prompt</label>
                        <textarea
                            id="question-text"
                            name="question_text"
                            className={styles.textarea}
                            placeholder="Type the challenge question students will answer."
                            required
                        />

                        <section className={styles.formCard}>
                            <h2>Answer options</h2>
                            <div className={styles.optionList}>
                                {['1', '2', '3', '4'].map((n, index) => (
                                    <div key={n} className={styles.optionRow}>
                                        <span className={styles.optionBadge}>{index + 1}</span>
                                        <input
                                            name={`answer_option_${n}`}
                                            className={styles.input}
                                            placeholder={`Option ${String.fromCharCode(64 + index + 1)}`}
                                            type="text"
                                        />
                                        <label className={styles.checkLabel}>
                                            <input
                                                type="radio"
                                                name="correct_answer_option"
                                                value={n}
                                                required
                                            /> Correct
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className={styles.formCard}>
                            <h2>Tags</h2>
                            <div className={styles.optionList}>
                                {tags.map((tag) => (
                                    <label key={tag.id} className={styles.checkLabel}>
                                        <input type="checkbox" name="tag_ids" value={tag.id} />
                                        {tag.name}
                                    </label>
                                ))}
                            </div>
                        </section>

                        {createState.error && (
                            <p style={{ color: '#ff6f3c', fontSize: '0.85rem' }}>{createState.error}</p>
                        )}
                        {createState.success && (
                            <p style={{ color: '#2ee6d6', fontSize: '0.85rem' }}>Question created!</p>
                        )}

                        <button type="submit" className={styles.primaryBtn}>
                            Save Question
                        </button>
                    </section>
                </form>
            )}
        </>
    );
}
'use client';

import { useActionState } from 'react';
import styles from '../../../../teacher_home/teacher_home.module.css';
import { addQuestionToDeck } from './actions';

type Question = { id: string; question_text: string };

export default function AddQuestionForm({
                                            deckId,
                                            courseId,
                                            questions,
                                        }: {
    deckId: string;
    courseId: string;
    questions: Question[];
}) {
    const [state, formAction] = useActionState(addQuestionToDeck, {});

    return (
        <div>
            <form action={formAction}>
                <input type="hidden" name="deckId" value={deckId} />
                <input type="hidden" name="courseId" value={courseId} />
                <select name="questionId" required className={styles.select}>
                    <option value="" hidden style={{ background: '#1b1033', color: '#f7f3ff' }}>
                        {questions.length === 0 ? 'No available questions' : 'Select a question...'}
                    </option>
                    {questions.map((q) => (
                        <option key={q.id} value={q.id} style={{ background: '#1b1033', color: '#f7f3ff' }}>
                            {q.question_text.length > 60
                                ? q.question_text.slice(0, 60) + '...'
                                : q.question_text}
                        </option>
                    ))}
                </select>
                {state?.error && (
                    <p style={{ color: '#ff6f3c', fontSize: '0.85rem', marginBottom: '8px' }}>
                        {state.error}
                    </p>
                )}
                {state?.success && (
                    <p style={{ color: '#2ee6d6', fontSize: '0.85rem', marginBottom: '8px' }}>
                        Question added to deck.
                    </p>
                )}
                <button className={styles.primaryBtn} type="submit">
                    Add to deck
                </button>
            </form>
        </div>
    );
}

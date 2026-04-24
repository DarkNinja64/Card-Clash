'use client';

import { useState, useActionState } from 'react';
import styles from '../../../../teacher_home/teacher_home.module.css';
import { addQuestionToDeck } from './actions';

type Question = { id: string; question_text: string; question_tags: { tag_id: string }[] };
type Tag = { id: string; name: string };

export default function AddQuestionForm({
                                            deckId,
                                            courseId,
                                            questions,
                                            tags,
                                        }: {
    deckId: string;
    courseId: string;
    questions: Question[];
    tags: Tag[];
}) {



    const [state, formAction] = useActionState(addQuestionToDeck, {});

    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

    const toggleTag = (tagId: string) => {
        setSelectedTagIds((prev) => {
            const next = new Set(prev);
            if (next.has(tagId)) {
                next.delete(tagId);
            } else {
                next.add(tagId);
            }
            return next;
        });
    };

    const filteredQuestions = selectedTagIds.size > 0
        ? questions.filter((q) =>
            (q.question_tags as { tag_id: string }[]).some((qt) => selectedTagIds.has(qt.tag_id))
        )
        : questions;

    return (
        <div>

            {tags.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: 'rgba(247,243,255,0.7)', fontSize: '0.85rem', marginBottom: '8px' }}>
                        Filter by tag {selectedTagIds.size > 0 && `(${selectedTagIds.size} selected)`}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {tags.map((tag) => (
                            <label key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'rgba(247,243,255,0.7)' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedTagIds.has(tag.id)}
                                    onChange={() => toggleTag(tag.id)}
                                /> {tag.name}
                            </label>
                        ))}
                        {selectedTagIds.size > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTagIds(new Set())}
                                style={{ fontSize: '0.8rem', color: 'rgba(247,243,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}

            <form action={formAction}>
                <input type="hidden" name="deckId" value={deckId} />
                <input type="hidden" name="courseId" value={courseId} />
                <select name="questionId" required className={styles.select}>
                    <option value="" hidden style={{ background: '#1b1033', color: '#f7f3ff' }}>
                        {filteredQuestions.length === 0 ? 'No questions for this tag' : 'Select a question...'}
                    </option>
                    {filteredQuestions.map((q) => (
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
                        Question added!
                    </p>
                )}
                <button className={styles.primaryBtn} type="submit">
                    Add to deck
                </button>
            </form>
        </div>
    );
}
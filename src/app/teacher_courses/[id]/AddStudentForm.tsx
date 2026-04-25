'use client';

import { useActionState } from 'react';
import styles from '../../teacher_home/teacher_home.module.css';
import { enrollStudent } from './actions';

export default function AddStudentForm({ courseId }: { courseId: string }) {
    const [state, formAction] = useActionState(enrollStudent, {});

    return (
        <form action={formAction}>
            <input type="hidden" name="courseId" value={courseId} />
            <input
                name="displayname"
                type="text"
                placeholder="Student display name"
                required
                style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.07)', color: '#f7f3ff',
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
                    Student enrolled!
                </p>
            )}
            <button className={styles.primaryBtn} type="submit">
                Add Student
            </button>
        </form>
    );
}
'use client';

import { useActionState } from 'react';
import styles from '../teacher_home/teacher_home.module.css';
import {createCourse} from "@/app/teacher_courses/actions";

export default function CreateCourseForm() {
    const [state, formAction] = useActionState(createCourse, {});

    return (
        <div className={styles.panel}>
            <h3>New Course</h3>
            <form action={formAction}>
                <input
                    name="name"
                    type="text"
                    placeholder="Course name"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.07)', color: '#f7f3ff',
                        marginBottom: '10px' }}
                />
                {state?.error && (
                    <p style={{ color: '#ff6f3c', fontSize: '0.85rem', marginBottom: '8px' }}>
                        {state.error}
                    </p>
                )}
                {state?.success && (
                    <p style={{ color: '#2ee6d6', fontSize: '0.85rem', marginBottom: '8px' }}>
                        Course created!
                    </p>
                )}
                <button className={styles.primaryBtn} type="submit">
                    Create Course
                </button>
            </form>
        </div>
    );
}
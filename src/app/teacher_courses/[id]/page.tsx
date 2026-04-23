import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from 'next/navigation';
import UserName from "@/components/UserName";
import styles from '../../teacher_home/teacher_home.module.css';
import AddStudentForm from "@/app/teacher_courses/[id]/AddStudentForm";

type Props = { params: Promise<{ id: string }> };

export default async function CourseDetailPage({ params }: Props) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/teacher_login');

    const admin = createAdminClient();

    // Fetch course and verify ownership
    const { data: course } = await admin
        .from('courses')
        .select('id, name, created_at')
        .eq('id', id)
        .eq('teacher_id', user.id)
        .single();

    if (!course) notFound();

    // Step 1: get enrollment rows
    const { data: enrollments } = await admin
        .from('course_enrollments')
        .select('id, student_id')
        .eq('course_id', id);

// Step 2: look up display names for those student IDs
    const studentIds = enrollments?.map(e => e.student_id) ?? [];

    const { data: studentProfiles } = studentIds.length > 0
        ? await admin
            .from('profiles')
            .select('id, displayname')
            .in('id', studentIds)
        : { data: [] };

    // Fetch decks for this course
    const { data: decks } = await admin
        .from('decks')
        .select('id, created_at')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}><UserName /></p>
                        <p className={styles.brandTag}>{course.name}</p>
                    </div>
                </div>
                <a className={styles.secondaryBtn} href="/teacher_courses">← Back</a>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div>
                        <h1>{course.name}</h1>
                        <p>Created {new Date(course.created_at).toLocaleDateString()}</p>
                    </div>
                </section>

                <div className={styles.grid}>
                    {/* Enrolled Students */}
                    <div className={styles.panel}>
                        <h3>Students ({studentProfiles?.length ?? 0})</h3>

                        {studentProfiles && studentProfiles.length > 0 ? (
                            studentProfiles.map((profile) => (
                                <p key={profile.id} style={{ color: 'rgba(247,243,255,0.8)' }}>
                                    {profile.displayname}
                                </p>
                            ))
                        ) : (
                            <p style={{ color: 'rgba(247,243,255,0.5)' }}>No students enrolled yet.</p>
                        )}
                        <AddStudentForm courseId={id} />
                    </div>

                    {/* Decks */}
                    <div className={styles.panel}>
                        <h3>Decks ({decks?.length ?? 0})</h3>
                        {decks && decks.length > 0 ? (
                            decks.map((deck) => (
                                <p key={deck.id} style={{ color: 'rgba(247,243,255,0.8)' }}>
                                    Deck — {new Date(deck.created_at).toLocaleDateString()}
                                </p>
                            ))
                        ) : (
                            <p style={{ color: 'rgba(247,243,255,0.5)' }}>No decks yet.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
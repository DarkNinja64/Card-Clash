import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import  UserName  from "@/components/UserName";
import styles from '../teacher_home/teacher_home.module.css';
import { createCourse } from './actions';

export default async function TeacherCoursesPage()
{
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/teacher_login');

    const admin = await createAdminClient();
    const { data: courses } = await admin
        .from('courses')
        .select('id, name, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false } );

    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}><UserName/></p>
                        <p className={styles.brandTag}>My Courses</p>
                    </div>
                </div>
                <a className={styles.secondaryBtn} href="/teacher_home">← Back</a>
            </header>
            <main className={styles.main}>
                <section className={styles.hero}>
                    <div>
                        <h1>Your Courses</h1>
                        <p>Create and manage the courses your students enroll in.</p>
                    </div>
                </section>
                <div className={styles.grid}>
                    {/* Create course form */}
                    <div className={styles.panel}>
                        <h3>New Course</h3>
                        <form action={createCourse}>
                            <input type="hidden" name="teacher_id" value={user.id} />
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
                            <button className={styles.primaryBtn} type="submit">
                                Create Course
                            </button>
                        </form>
                    </div>
                    {/* Course list */}
                    {courses && courses.length > 0 ? (
                        courses.map((course) => (
                            <div key={course.id} className={styles.panel}>
                                <h3>{course.name}</h3>
                                <p style={{ color: 'rgba(247,243,255,0.6)', fontSize: '0.85rem' }}>
                                    Created {new Date(course.created_at).toLocaleDateString()}
                                </p>
                                <a className={styles.ghostBtn} href={`/teacher_courses/${course.id}`}>
                                    View Course →
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className={styles.panel}>
                            <p style={{ color: 'rgba(247,243,255,0.6)' }}>
                                No courses yet. Create your first one.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
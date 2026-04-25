
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import UserName from "@/components/UserName"
import styles from '../student_home/student_home.module.css';
import {createAdminClient} from "@/lib/supabase/admin";


/*
 Student page for managing courses, checking their performance, etc
 */

export default async function StudentCourseEnrollmentPage() {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) redirect('/student_login');


    const admin = createAdminClient();

    const {data: enrollments} = await admin
        .from('course_enrollments')
        .select('id, course_id')
        .eq('student_id', user.id);

    const courseIds = enrollments?.map((e) => e.course_id) ?? [];

    const {data: courses} = courseIds.length > 0
        ? await admin
            .from('courses')
            .select('id, name, created_at')
            .in('id', courseIds)
        : {data: []}


    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark}/>
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}>Welcome back, <UserName/></p>
                    </div>
                </div>
                <a className={styles.secondaryBtn} href="/student_home"> ← Back</a>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div>
                        <h1>Your Courses</h1>
                        <p>Courses you are currently enrolled in.</p>
                    </div>
                </section>

                <div className={styles.grid}>
                    {courses && courses.length > 0 ? (
                        courses.map((course) => (
                            <div key={course.id} className={styles.panel}>
                                <h3>{course.name}</h3>
                                <p style={{color: 'rgba(247,243,255,0.6)', fontSize: '0.85rem'}}>
                                    {course.created_at
                                        ? `Enrolled since ${new Date(course.created_at).toLocaleDateString()}`
                                        : 'Recently enrolled'}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className={styles.panel}>
                            <p style={{color: 'rgba(247,243,255,0.6)'}}>
                                You are not enrolled in any courses yet.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
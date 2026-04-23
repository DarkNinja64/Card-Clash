
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import UserName from "@/components/UserName"
import styles from '../student_home/student_home.module.css';


/*
 Student page for managing courses, checking their performance, etc
 */

export default async function StudentCourseEnrollmentPage()
{
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)  redirect('/student_login');


    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
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
                        <p>Look at your courses</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
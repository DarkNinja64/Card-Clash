import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import styles from "./questions.module.css";
import QuestionManager from "./QuestionManager";

export default async function QuestionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/teacher_login');

    const admin = createAdminClient();

    const { data: questions } = await admin
        .from('questions')
        .select('id, question_text, answer_options(id, answer_text, is_correct)')
        .order('id', { ascending: false });

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Teacher tools</p>
                    <h1>Question Bank</h1>
                    <p className={styles.subtitle}>
                        Select a question to view its details, or create a new one.
                    </p>
                </div>
                <a className={styles.secondaryBtn} href="/teacher_home"> ← Back</a>

            </header>
            <main className={styles.main}>
                <QuestionManager questions={questions ?? []} />
            </main>
        </div>
    );
}

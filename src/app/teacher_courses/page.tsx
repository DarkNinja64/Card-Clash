import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import  UserName  from "@/components/UserName";
import styles from '../teacher_home/teacher_home.module.css';
import CreateDeckForm from './CreateDeckForm';
import DeleteDeckButton from './DeleteDeckButton';
import Link from "next/link";

export default async function TeacherCoursesPage()
{
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/teacher_login');

    const admin = createAdminClient();
    const { data: decks } = await admin
        .from('decks')
        .select('id, name, created_at, course_id, share_code')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false } );

    const deckIds = decks?.map((deck) => deck.id) ?? [];
    const { data: deckCards } = deckIds.length > 0
        ? await admin
            .from('deck_question_cards')
            .select('id, deck_id')
            .in('deck_id', deckIds)
        : { data: [] };

    const questionCounts = new Map<string, number>();
    for (const card of deckCards ?? []) {
        questionCounts.set(card.deck_id, (questionCounts.get(card.deck_id) ?? 0) + 1);
    }

    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}><UserName/></p>
                        <p className={styles.brandTag}>My Decks</p>
                    </div>
                </div>
                <a className={styles.secondaryBtn} href="/teacher_home"> ← Back</a>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div>
                        <h1>Your Decks</h1>
                        <p>Create a deck, then add questions underneath it. No course setup required.</p>
                    </div>
                </section>
                <div className={styles.grid}>
                    <div className={styles.panel}>
                        <CreateDeckForm />
                    </div>

                    {decks && decks.length > 0 ? (
                        decks.map((deck) => (
                            <div key={deck.id} className={styles.panel}>
                                <h3>{deck.name}</h3>
                                <p style={{ color: 'rgba(247,243,255,0.6)', fontSize: '0.85rem' }}>
                                    {deck.created_at
                                        ? `Created ${new Date(deck.created_at).toLocaleDateString()}`
                                        : 'Recently created'}
                                </p>
                                <p style={{ color: 'rgba(247,243,255,0.75)' }}>
                                    {questionCounts.get(deck.id) ?? 0} questions
                                </p>

                                {deck.share_code && (
                                    <p style={{ marginTop: '0.5rem' }}>
                                        <span style={{ color: 'rgba(247,243,255,0.6)', fontSize: '0.8rem' }}>
                                            Student code:{' '}
                                        </span>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.15em',
                                            background: 'rgba(247,243,255,0.12)',
                                            border: '1px solid rgba(247,243,255,0.2)',
                                            borderRadius: '6px',
                                            padding: '2px 10px',
                                            color: 'rgba(247,243,255,0.95)',
                                        }}>
                                            {deck.share_code}
                                        </span>
                                    </p>
                                )}


                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <Link className={styles.ghostBtn} href={`/teacher_courses/${deck.course_id}/deck/${deck.id}`}>
                                        Open Deck →
                                    </Link>
                                    <DeleteDeckButton deckId={deck.id} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.panel}>
                            <p style={{ color: 'rgba(247,243,255,0.6)' }}>
                                No decks yet. Create your first one.
                            </p>
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
}

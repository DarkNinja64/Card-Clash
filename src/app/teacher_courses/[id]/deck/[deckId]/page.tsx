import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import UserName from "@/components/UserName";
import styles from '../../../../teacher_home/teacher_home.module.css';
import AddQuestionForm from './AddQuestionForm';
import DeckCardManager from './DeckCardManager';

type Props = { params: Promise<{ id: string; deckId: string }> };

type DeckCardAnswer = {
    id: string;
    deck_question_card_id: string;
    answer_text: string;
    is_correct: boolean;
};

export default async function DeckDetailPage({ params }: Props) {
    const { id, deckId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/teacher_login');

    const admin = createAdminClient();

    // Fetch deck and verify it belongs to the right course
    const { data: deck } = await admin
        .from('decks')
        .select('id, name, course_id')
        .eq('id', deckId)
        .eq('course_id', id)
        .single();

    if (!deck) notFound();

    const { data: course } = await admin
        .from('courses')
        .select('name')
        .eq('id', deck.course_id)
        .single();

    // Questions already in this deck
    const { data: deckQuestions } = await admin
        .from('deck_question_cards')
        .select('id, question_id, question_text')
        .eq('deck_id', deckId);

    // Fetch deck card answer options separately
    const deckCardIds = deckQuestions?.map((dq) => dq.id) ?? [];
    const { data: deckCardAnswers } = deckCardIds.length > 0
        ? await admin
            .from('deck_question_card_answer_options' as unknown as string)
            .select('id, deck_question_card_id, answer_text, is_correct')
            .in('deck_question_card_id', deckCardIds)
        : { data: [] };
// Combine into a single structure for the client component
    const deckCards = (deckQuestions ?? []).map((dq) => ({
        ...dq,
        answers: (deckCardAnswers ?? []).filter(
            (a: DeckCardAnswer) => a.deck_question_card_id === dq.id
        ),
    }));

    // All questions available to add (exclude ones already in the deck)
    const existingQuestionIds = deckQuestions?.map((dq) => dq.question_id) ?? [];

    const { data: availableQuestions } = existingQuestionIds.length > 0
        ? await admin
            .from('questions')
            .select('id, question_text')
            .not('id', 'in', `(${existingQuestionIds.join(',')})`)
        : await admin
            .from('questions')
            .select('id, question_text');



    return (
        <div className={styles.page}>
            <header className={styles.nav}>
                <div className={styles.brand}>
                    <span className={styles.brandMark} />
                    <div>
                        <p className={styles.brandTitle}>Card Clash</p>
                        <p className={styles.brandTag}><UserName /></p>
                        <p className={styles.brandTag}>{deck.name} - {course?.name}</p>
                    </div>
                </div>
                <Link className={styles.secondaryBtn} href={`/teacher_courses/${id}`}>← Back</Link>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div>
                        <h1>{deck.name}</h1>
                        <p>{deckQuestions?.length ?? 0} questions in this deck</p>
                    </div>
                </section>

                <div className={styles.grid}>
                    <DeckCardManager deckCards={deckCards} courseId={id} deckId={deckId} />

                    <div className={styles.panel}>
                        <h3>Add from question bank</h3>
                        {availableQuestions && availableQuestions.length > 0 ? (
                            <AddQuestionForm
                                deckId={deckId}
                                courseId={id}
                                questions={availableQuestions} />
                        ) : (
                            <p style={{ color: 'rgba(247,243,255,0.5)' }}>
                                All questions are already in this deck.
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

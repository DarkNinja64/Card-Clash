'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type StudyDeck = {
    id: string;
    name: string;
    courseName?: string;
};

export type StudyQuestion = {
    id: string;
    text: string;
    type: string;
    options: { text: string }[];
    timer_seconds: number;
    correct_answer: string;
};

export async function fetchDecksForStudySession(): Promise<StudyDeck[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const admin = createAdminClient();

    const { data: savedDecks } = await admin
        .from('student_saved_decks')
        .select(`
            deck_id,
            decks (
                id,
                name,
                course_id,
                courses (
                    name
                )
            )
        `)
        .eq('student_id', user.id);

   if (!savedDecks || savedDecks.length === 0) return [];

    return savedDecks
        .map((row) => {
            const deck = row.decks as any;
            if (!deck) return null;
            return {
                id: deck.id,
                name: deck.name,
                courseName: deck.courses?.name ?? undefined,
            };
        })
        .filter(Boolean) as StudyDeck[];
}

export async function fetchQuestionsForStudySession(deckId?: string): Promise<StudyQuestion[]> {
    if (!deckId) return [];

    const admin = createAdminClient();
    const { data, error } = await admin
        .from('deck_question_cards')
        .select('id, question_text, deck_question_card_answer_options(answer_text, is_correct)')
        .eq('deck_id', deckId)
        .limit(20);

    if (error) throw new Error('Failed to fetch deck questions');

    return (data ?? [])
        .map((row) => {
            const options = (row.deck_question_card_answer_options ?? [])
                .map((option) => option.answer_text)
                .filter(Boolean);

            const correctAnswer = row.deck_question_card_answer_options?.find((option) => option.is_correct)?.answer_text?.trim().toLowerCase() ?? '';

            return {
                id: row.id,
                text: row.question_text,
                type: 'mc',
                options: options.map((text) => ({ text })),
                timer_seconds: 60,
                correct_answer: correctAnswer,
            };
        })
        .filter((question) => question.options.length >= 2 && question.correct_answer);
}

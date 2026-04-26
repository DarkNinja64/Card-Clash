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

    const { data: enrollments } = await admin
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user.id);

    const courseIds = enrollments?.map((enrollment) => enrollment.course_id) ?? [];

    const { data: decks } = courseIds.length > 0
        ? await admin
            .from('decks')
            .select('id, name, course_id')
            .in('course_id', courseIds)
            .order('name')
        : await admin
            .from('decks')
            .select('id, name, course_id')
            .order('name');

    const courseNameById = new Map<string, string>();
    if (courseIds.length > 0) {
        const { data: courses } = await admin
            .from('courses')
            .select('id, name')
            .in('id', courseIds);

        for (const course of courses ?? []) {
            courseNameById.set(course.id, course.name);
        }
    }

    return (decks ?? []).map((deck) => ({
        id: deck.id,
        name: deck.name,
        courseName: deck.course_id ? courseNameById.get(deck.course_id) : undefined,
    }));
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

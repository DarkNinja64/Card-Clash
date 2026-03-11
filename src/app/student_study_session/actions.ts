
'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type StudyQuestion = {
    id: string;
    text: string;
    type: string;
    options: { text: string }[];
    timer_seconds: number;
    correct_answer: string;
};


/** Fetch distinct categories from question_card */
export async function fetchCategoriesForStudySession(): Promise<string[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('question_card')
        .select('category')
        .not('category', 'is', null);

    if (error) throw new Error('Failed to fetch categories');

    const categories = [...new Set((data ?? []).map((r) => (r.category || '').trim()).filter(Boolean))];
    return categories.sort((a, b) => a.localeCompare(b));
}


export async function fetchQuestionsForStudySession(category?: string): Promise<StudyQuestion[]> {
    const supabase = createAdminClient();
    let query = supabase.from('question_card').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) throw new Error('Failed to fetch questions');

    return (data ?? []).map((row) => {
        const opts = [
            row.answer_option_1,
            row.answer_option_2,
            row.answer_option_3,
            row.answer_option_4,
        ].filter(Boolean);
        const correctIdx = Math.max(0, parseInt(String(row.correct_answer_option || '1'), 10) - 1);
        const correctAnswer = opts[correctIdx]?.trim().toLowerCase() ?? '';
        return {
            id: row.id,
            text: row.question,
            type: 'mc',
            options: opts.map((t) => ({ text: t })),
            timer_seconds: row.timer_seconds ?? 60,
            correct_answer: correctAnswer,
        };
    });
}
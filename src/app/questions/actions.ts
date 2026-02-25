
'use server';


import { createAdminClient } from '@/lib/supabase/admin';

/*
 Insert a question_card record into the database
 */
export async function createQuestionCard(formData: FormData) {
    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    const category = (formData.get('category') as string) || '';
    const question = (formData.get('question') as string) || '';
    const difficulty = ((formData.get('difficulty') as string) || 'intro').toLowerCase();
    const timer_seconds = parseInt(formData.get('timer_seconds') as string) || 60;
    const answer_option_1 = (formData.get('answer_option_1') as string) || '';
    const answer_option_2 = (formData.get('answer_option_2') as string) || '';
    const answer_option_3 = (formData.get('answer_option_3') as string) || '';
    const answer_option_4 = (formData.get('answer_option_4') as string) || '';

    const { data, error } = await supabase
        .from('question_card')
        .insert({
            category,
            question,
            difficulty,
            timer_seconds,
            answer_option_1,
            answer_option_2,
            answer_option_3,
            answer_option_4,
        })
        .select()
        .single();

    if (error) {
        throw new Error('Database error');
    }

    return data;
}

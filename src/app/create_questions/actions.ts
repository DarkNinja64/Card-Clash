
'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

/*
 Insert a question_card record into the database
 */
export async function createQuestionCard(formData: FormData) {
    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase environment variables.');
    }

    const category = (formData.get('category') as string) || '';
    const question = (formData.get('question') as string) || '';
    const difficulty = ((formData.get('difficulty') as string) || 'intro').toLowerCase();
    const timer_seconds = parseInt(formData.get('timer_seconds') as string) || 60;
    const answer_option_1 = (formData.get('answer_option_1') as string) || '';
    const answer_option_2 = (formData.get('answer_option_2') as string) || '';
    const answer_option_3 = (formData.get('answer_option_3') as string) || '';
    const answer_option_4 = (formData.get('answer_option_4') as string) || '';
    const correct_answer_option = (formData.get('correct_answer_option') as string) || '';

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
            correct_answer_option,
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message || 'Database error');
    }else{
        revalidatePath('/questions');
    }

    return data;
}

export async function removeQuestionCard(formData: FormData){
    const supabase = createAdminClient();
    const question = (formData.get('question') as string) || '';
    const { error } = await supabase
        .from('question_card')
        .delete()
        .eq('question', question);
    if (error) {
         console.error('Supabase removal error:', error);
        throw new Error(error.message || 'Database error');
    }else{
        revalidatePath('/questions');
    }

}
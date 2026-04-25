'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type QuestionActionState = { error?: string; success?: boolean };

export async function createQuestion
(prevState: QuestionActionState,
 formData: FormData ): Promise<QuestionActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {error: 'Not authenticated'};

    const question_text = (formData.get('question_text') as string)?.trim();
    if (!question_text) return {error: 'Question text is required'};

    const admin = createAdminClient();

    // Insert question
    const { data: question, error: questionError } = await admin
        .from('questions')
        .insert({ question_text, created_by: user.id })
        .select('id')
        .single();

    if (questionError) return {error: questionError.message};

    // Build answer options — only include non-empty ones
    const correctOption = formData.get('correct_answer_option') as string;
    const answerOptions = ['1', '2', '3', '4']
        .map((n) => ({
            question_id: question.id,
            answer_text: (formData.get(`answer_option_${n}`) as string)?.trim(),
            is_correct: correctOption === n,
        }))
        .filter((opt) => opt.answer_text);

    if (answerOptions.length < 2) return {error: 'At least 2 answer options are required'};

    const { error: answersError } = await admin
        .from('answer_options')
        .insert(answerOptions);

    if (answersError) return {error:answersError.message};

    const tagIds = formData.getAll('tag_ids') as string[];

    if (tagIds.length > 0) {
        const questionTags = tagIds.map((tag_id) => ({
            question_id: question.id,
            tag_id,
        }));

        const { error: tagsError } = await admin
            .from('question_tags')
            .insert(questionTags);

        if (tagsError) return {error:tagsError.message};
    }

    revalidatePath('/create_questions');
    return {success: true};
}

export async function updateQuestion(
    prevState: QuestionActionState,
    formData: FormData
): Promise<QuestionActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    const questionId = formData.get('question_id') as string;
    const question_text = (formData.get('question_text') as string)?.trim();
    if (!question_text) return { error: 'Question text is required' };
    const admin = createAdminClient();
    const { error: updateError } = await admin
        .from('questions')
        .update({ question_text })
        .eq('id', questionId);
    if (updateError) return { error: updateError.message };
    // Replace answer options
    await admin.from('answer_options').delete().eq('question_id', questionId);
    const correctOption = formData.get('correct_answer_option') as string;
    const answerOptions = ['1', '2', '3', '4']
        .map((n) => ({
            question_id: questionId,
            answer_text: (formData.get(`answer_option_${n}`) as string)?.trim(),
            is_correct: correctOption === n,
        }))
        .filter((opt) => opt.answer_text);
    if (answerOptions.length < 2) return { error: 'At least 2 answer options are required' };
    const { error: answersError } = await admin.from('answer_options').insert(answerOptions);
    if (answersError) return { error: answersError.message };
    // Replace tags
    await admin.from('question_tags').delete().eq('question_id', questionId);
    const tagIds = formData.getAll('tag_ids') as string[];
    if (tagIds.length > 0) {
        await admin.from('question_tags').insert(
            tagIds.map((tag_id) => ({ question_id: questionId, tag_id }))
        );
    }
    revalidatePath('/create_questions');
    return { success: true };
}


export async function removeQuestion(formData: FormData) {
    const admin = createAdminClient();
    const questionId = formData.get('question_id') as string;

    // Delete answer options first in case there's no cascade
    await admin.from('answer_options').delete().eq('question_id', questionId);

    const { error } = await admin.from('questions').delete().eq('id', questionId);
    if (error) throw new Error(error.message);

    revalidatePath('/create_questions');
}
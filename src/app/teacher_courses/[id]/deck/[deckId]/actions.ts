'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type DeckQuestionActionState = { error?: string; success?: boolean };

export async function addQuestionToDeck(
    prevState: DeckQuestionActionState,
    formData: FormData
): Promise<DeckQuestionActionState> {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return {error: 'Not authenticated'};

    const deckId = formData.get('deckId') as string;
    const questionId = formData.get('questionId') as string;
    if (!questionId) return {error: 'Please select a question'};

    const admin = createAdminClient();

    const {data: question} = await admin
        .from('questions')
        .select('question_text')
        .eq('id', questionId)
        .single();

    if (!question) return {error: 'Question not found'};

    const {data: sourceAnswers} = await admin
        .from('answer_options')
        .select('answer_text, is_correct')
        .eq('question_id', questionId);


    const {data: deckCard, error: insertError } = await admin
        .from('deck_question_cards')
        .insert({deck_id: deckId, question_id: questionId, question_text: question.question_text})
        .select('id')
        .single();

    if (insertError?.code === '23505') return { error: 'Question is already in this deck' };
    if (insertError) return { error: insertError.message };
    if (!deckCard) return {error: 'Deck card not found'};


    if (sourceAnswers && sourceAnswers.length > 0)
    {
        await admin
            .from('deck_question_card_answer_options')
            .insert(
                sourceAnswers.map((a) => ({
                    deck_question_card_id: deckCard.id,
                    answer_text: a.answer_text,
                    is_correct: a.is_correct,
                }))
            );
    }


    revalidatePath(`/teacher_courses/${deckId}`);
    return {success: true};
}

    export async function updateDeckCard(
        prevState: DeckQuestionActionState,
        formData: FormData
    ): Promise<DeckQuestionActionState> {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const deckCardId = formData.get('deckCardId') as string;
        const courseId = formData.get('courseId') as string;
        const deckId = formData.get('deckId') as string;
        const question_text = (formData.get('question_text') as string)?.trim();
        if (!question_text) return { error: 'Question text is required' };

        const admin = createAdminClient();

        const { error: updateError } = await admin
            .from('deck_question_cards')
            .update({ question_text })
            .eq('id', deckCardId);

        if (updateError) return { error: updateError.message };


        await admin
            .from('deck_question_card_answer_options' as unknown as string)
            .delete()
            .eq('deck_question_card_id', deckCardId);

        const correctAnswer = formData.get('correct_answer') as string;
        const answers = ['1', '2', '3', '4']
            .map((n) => ({
                deck_question_card_id: deckCardId,
                answer_text: (formData.get(`answer_text_${n}`) as string)?.trim(),
                is_correct: correctAnswer === n,
            }))
            .filter((a) => a.answer_text);

        if (answers.length < 2) return { error: 'At least 2 answer options are required' };

        await admin
            .from('deck_question_card_answer_options' as unknown as string)
            .insert(answers);

        revalidatePath(`/teacher_courses/${courseId}/deck/${deckId}`);
        return { success: true };
    }

    export async function removeDeckCard(
        prevState: DeckQuestionActionState,
        formData: FormData
    ): Promise<DeckQuestionActionState> {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const deckCardId = formData.get('deckCardId') as string;
        const courseId = formData.get('courseId') as string;
        const deckId = formData.get('deckId') as string;

        const admin = createAdminClient();

        const { error } = await admin
            .from('deck_question_cards')
            .delete()
            .eq('id', deckCardId);

        if (error) return { error: error.message };

        revalidatePath(`/teacher_courses/${courseId}/deck/${deckId}`);
        return { success: true };
    }

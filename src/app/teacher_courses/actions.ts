'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CourseActionState = { error?: string; success?: boolean };
export type DeckActionState = { error?: string; success?: boolean };

const DEFAULT_COURSE_NAME = 'My Decks';

async function ensureDefaultCourse(admin: ReturnType<typeof createAdminClient>, teacherId: string) {
    const { data: existingCourse } = await admin
        .from('courses')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('name', DEFAULT_COURSE_NAME)
        .maybeSingle();

    if (existingCourse?.id) return existingCourse.id;

    const { data: createdCourse, error } = await admin
        .from('courses')
        .insert({ name: DEFAULT_COURSE_NAME, teacher_id: teacherId })
        .select('id')
        .single();

    if (error || !createdCourse) {
        throw new Error(error?.message || 'Could not create default deck container');
    }

    return createdCourse.id;
}

export async function createCourse(
    prevState: CourseActionState,
    formData: FormData
): Promise<CourseActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const name = formData.get('name') as string;
    if (!name?.trim()) return { error: 'Course name is required' };

    const admin = createAdminClient();
    const { error:insert_error } = await admin
        .from('courses')
        .insert({ name: name.trim(), teacher_id: user.id });

    if (insert_error) return { error: insert_error.message };

    revalidatePath('/teacher_courses');
    return {success: true};
}

export async function createDeck(
    prevState: DeckActionState,
    formData: FormData
): Promise<DeckActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const name = formData.get('name') as string;
    if (!name?.trim()) return { error: 'Deck name is required' };

    const admin = createAdminClient();

    let courseId: string;
    try {
        courseId = await ensureDefaultCourse(admin, user.id);
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Could not prepare deck container' };
    }

    const { error: insertError } = await admin
        .from('decks')
        .insert({ name: name.trim(), course_id: courseId, created_by: user.id });

    if (insertError?.code === '23505') return { error: 'A deck with that name already exists' };
    if (insertError) return { error: insertError.message };

    revalidatePath('/teacher_courses');
    return { success: true };
}

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CourseActionState = { error?: string; success?: boolean };

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
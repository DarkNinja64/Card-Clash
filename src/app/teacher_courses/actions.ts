'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createCourse(formData: FormData) {
    const name = formData.get('name') as string;
    const teacher_id = formData.get('teacher_id') as string;

    if (!name?.trim()) return;

    const admin = createAdminClient();
    await admin.from('courses').insert({ name: name.trim(), teacher_id });

    revalidatePath('/teacher_courses');
}
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type EnrollmentActionState = { error?: string; success?: boolean };

export async function enrollStudent(
    prevState: EnrollmentActionState,
    formData: FormData
): Promise<EnrollmentActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const courseId = formData.get('courseId') as string;
    const email = formData.get('email') as string;
    if (!email?.trim()) return { error: 'Student email is required' };

    const admin = createAdminClient();

    const { data: profile } = await admin
        .from('profiles')
        .select('id, role')
        .eq('email', email.trim())
        .eq('role', 'student')
        .single();

    if (!profile) return { error: 'No student account found with that email' };


    const { error: insertError } = await admin
        .from('course_enrollments')
        .insert({ course_id: courseId, student_id: profile.id });

    if (insertError?.code === '23505') return { error: 'Student is already enrolled' };
    if (insertError) return { error: insertError.message };

    revalidatePath(`/teacher_courses/${courseId}`);
    return { success: true };
}

export async function unenrollStudent(enrollmentId: string, courseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const admin = createAdminClient();
    const { error } = await admin
        .from('course_enrollments')
        .delete()
        .eq('id', enrollmentId);

    if (error) return { error: error.message };

    revalidatePath(`/teacher_courses/${courseId}`);
    return { success: true };
}
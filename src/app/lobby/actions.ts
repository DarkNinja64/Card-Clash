'use server';

import { createClient } from '@/lib/supabase/server';
import {createAdminClient} from "@/lib/supabase/admin";

export async function getTeacherToken(): Promise<{ token: string | null }> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return { token: session?.access_token ?? null };
}

export async function fetchTeacherDecks(): Promise<{ id: string; name: string }[]> {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return [];

    const admin = createAdminClient();
    const {data: courses} = await admin
        .from('courses')
        .select('id')
        .eq('teacher_id', user.id);

    const courseIds = courses?.map((c) => c.id) ?? [];
    if (courseIds.length === 0) return [];

    const {data: decks} = await admin
        .from('decks')
        .select('id, name')
        .in('course_id', courseIds)
        .order('name');

    return (decks ?? []) as { id: string; name: string }[];
}

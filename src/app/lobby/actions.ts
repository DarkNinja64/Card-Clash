'use server';

import { createClient } from '@/lib/supabase/server';

export async function getTeacherToken(): Promise<{ token: string | null }> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return { token: session?.access_token ?? null };
}

export async function fetchCategories(): Promise<string[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('question_card')
        .select('category');
    if (error || !data) return [];
    const categories = [...new Set(
        data.map((r: { category: string }) => r.category).filter(Boolean)
    )].sort() as string[];
    return categories;
}

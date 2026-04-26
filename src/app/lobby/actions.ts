'use server';

import { createClient } from '@/lib/supabase/server';
import {createAdminClient} from "@/lib/supabase/admin";

export async function getTeacherToken(): Promise<{ token: string | null }> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return { token: session?.access_token ?? null };
}

export async function fetchTeacherDecks(): Promise<{ id: string; name: string }[]> {
    const admin = createAdminClient();
    const { data: decks } = await admin
        .from('decks')
        .select('id, name')
        .order('name', { ascending: true });

    return (decks ?? []) as { id: string; name: string }[];
}

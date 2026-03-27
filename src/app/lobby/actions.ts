'use server';

import { createClient } from '@/lib/supabase/server';
import {createAdminClient} from "@/lib/supabase/admin";

export type SessionResult =
    | { ok: true; session_id: string; join_code: string }
    | { ok: false; error: string };

export async function getTeacherToken(): Promise<{ token: string | null }> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return { token: session?.access_token ?? null };
}

export async function createGameSession(): Promise<SessionResult> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return { ok: false, error: 'Not logged in. Please sign in as a teacher.' };
    }

    try {
        const res = await fetch('http://localhost:8000/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ config: {} }),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { ok: false, error: body.detail ?? `Server error ${res.status}` };
        }

        const data = await res.json();
        return { ok: true, session_id: data.session_id, join_code: data.join_code };
    } catch {
        return { ok: false, error: 'Could not reach the game server.' };
    }
}

export async function fetchQuestionsForGame(category?: string) {
    const supabase = createAdminClient(); // or createClient
    let query = supabase.from('question_card').select('*').limit(10);
    if (category) query = query.eq('category', category);
    const { data } = await query;
    return (data ?? []).map((row) => ({
        id: row.id,
        text: row.question,
        type: 'mc',
        options: [
            row.answer_option_1,
            row.answer_option_2,
            row.answer_option_3,
            row.answer_option_4,
        ].filter(Boolean),
        timer_seconds: row.timer_seconds ?? 30,
        correct_answer: row[`answer_option_${row.correct_answer_option}`] ?? '',
    }));
}

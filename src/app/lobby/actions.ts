'use server';

import { createClient } from '@/lib/supabase/server';

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

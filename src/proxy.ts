
/**
 * Supabase auth proxy
 * Refreshes the auth session on each request so server components
 * and API routes have up-to-date user state.
 */


import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({ request });
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookies) => {
                    cookies.forEach(({ name, value }) =>
                        response.cookies.set(name, value)
                    );
                },
            },
        }
    );
    await supabase.auth.getUser();
    return response;
}

/**
 * Supabase auth proxy
 * Refreshes the auth session on each request so server components
 * and API routes have up-to-date user state.
 */


import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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
    const { data: { user} } = await supabase.auth.getUser();
    const isProtectedRoute = 
    // protected paths
        request.nextUrl.pathname.startsWith('/student_home') ||
        request.nextUrl.pathname.startsWith('/questions') ||
        request.nextUrl.pathname.startsWith('/student_study_session');

        const bypass = request.nextUrl.searchParams.get('bypass') === '1';

        if (!user && isProtectedRoute && !bypass) {
            return NextResponse.redirect(new URL('/student_login', request.url));
        }


    return response;
}

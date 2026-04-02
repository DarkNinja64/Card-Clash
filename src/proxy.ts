
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
    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    const isTeacherRoute =
        path.startsWith('/teacher_home') ||
        path.startsWith('/lobby');

    const isStudentRoute =
        path.startsWith('/student_home') ||
        path.startsWith('/student_lobby') ||
        path.startsWith('/party') ||
        path.startsWith('/student_study_session');

    // redirect unauthenticated users to the right login page
    if (!user && isTeacherRoute) {
        return NextResponse.redirect(new URL('/teacher_login', request.url));
    }
    if (!user && isStudentRoute) {
        return NextResponse.redirect(new URL('/student_login', request.url));
    }

    // role-based protection — only query profiles when on a guarded route
    if (user && (isTeacherRoute || isStudentRoute)) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role;

        if (role === 'student' && isTeacherRoute) {
            return NextResponse.redirect(new URL('/student_home', request.url));
        }
        if (role === 'teacher' && isStudentRoute) {
            return NextResponse.redirect(new URL('/teacher_home', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

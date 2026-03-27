// src/components/UserName.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UserName() {
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                setName(''); // Will show Sign in
                return;
            }
            const meta = user.user_metadata;
            const n = (meta?.full_name as string) || (meta?.name as string) || (meta?.display_name as string)
                || user.email?.split('@')[0] || 'User';
            setName(n);
        });
    }, []);

    if (name === null) return null; // or a loading placeholder
    if (name === '') {
        return <Link href="/student_login" style={{ color: 'inherit', textDecoration: 'underline' }}>Sign in</Link>;
    }
    return <>{name}</>;
}
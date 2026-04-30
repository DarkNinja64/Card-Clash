'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../teacher_home/teacher_home.module.css';

export default function DeleteDeckButton({ deckId }: { deckId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm('Delete this deck? This will also remove all its questions and cannot be undone.')) return;
        setLoading(true);
        const supabase = createClient();
        await supabase.from('decks').delete().eq('id', deckId);
        router.refresh();
        setLoading(false);
    }

    return (
        <button
            className={styles.secondaryBtn}
            onClick={handleDelete}
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1 }}
        >
            {loading ? 'Removing...' : 'Remove'}
        </button>
    );
}

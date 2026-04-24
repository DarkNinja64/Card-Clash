// supabase client(browser) setup

/* --------- HOW TO USE IN CLIENT COMPONENTS ----------------

'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function DeckList() {
  const [decks, setDecks] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('decks').select('*').then(({ data }) => setDecks(data ?? []));
  }, []);

  return <div>{ render decks }</div>;
}


import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
*/



import { Database } from '@/types/database.types';
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Connect as a privileged client, bypass Row Level Security


import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}
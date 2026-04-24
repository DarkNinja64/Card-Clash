
// Connect as a privileged client, bypass Row Level Security

import { Database } from '@/types/database.types'
import { createClient } from '@supabase/supabase-js';


export function createAdminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}
import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client. SERVER ONLY — bypasses RLS, never import into a client component.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service env vars are missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

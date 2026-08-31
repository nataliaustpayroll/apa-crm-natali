// Seeds ONE admin user in Supabase Auth using the service-role key.
// Idempotent: if the user already exists, it updates the password instead.
// Usage: node scripts/seed-admin.mjs <email> <password>
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!email || !password) {
  console.error('Usage: node scripts/seed-admin.mjs <email> <password>');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Look for an existing user with this email.
const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
if (listErr) {
  console.error('Could not list users:', listErr.message);
  process.exit(1);
}
const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
  console.log(`Admin already existed — password reset and confirmed: ${email}`);
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('Create failed:', error.message);
    process.exit(1);
  }
  console.log(`Admin created and confirmed: ${email}`);
}

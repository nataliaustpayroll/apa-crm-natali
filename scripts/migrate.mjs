// Applies every SQL file in supabase/migrations (sorted) to the Supabase Postgres
// via the IPv4 connection pooler, using the DB password from .env.local.
// Usage: node scripts/migrate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { connect } from './db.mjs';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPERBASE_PASSWORD;
const region = process.env.SUPABASE_DB_REGION;

if (!url || !password) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPERBASE_PASSWORD in .env.local');
  process.exit(1);
}

const dir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

let client;
try {
  const conn = await connect({ url, password, region });
  client = conn.client;
  console.log(`Connected via ${conn.host} (region ${conn.region})`);
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    process.stdout.write(`Applying ${f} ... `);
    await client.query(sql);
    console.log('ok');
  }
  console.log('All migrations applied.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  if (client) await client.end();
}

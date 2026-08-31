// Shared Supabase Postgres connector.
// New Supabase projects expose the direct host (db.<ref>.supabase.co) over IPv6
// only, which many machines can't route. We connect via the IPv4 connection
// pooler in SESSION mode (port 5432, supports DDL). The pooler is region-scoped,
// so we probe a candidate list (Sydney first — APA is Australian) until the
// tenant authenticates. Override with SUPABASE_DB_REGION in .env.local to skip probing.
import pg from 'pg';

const REGIONS = [
  'ap-southeast-2', // Sydney
  'ap-southeast-1',
  'us-east-1',
  'us-west-1',
  'eu-west-2',
  'eu-central-1',
  'eu-west-1',
  'us-east-2',
];

export async function connect({ url, password, region }) {
  const ref = new URL(url).hostname.split('.')[0];
  const candidates = region ? [region] : REGIONS;

  let lastErr;
  for (const r of candidates) {
    for (const prefix of ['aws-0', 'aws-1']) {
      const host = `${prefix}-${r}.pooler.supabase.com`;
      const client = new pg.Client({
        host,
        port: 5432, // session mode
        user: `postgres.${ref}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      try {
        await client.connect();
        return { client, host, region: r };
      } catch (err) {
        lastErr = err;
        try {
          await client.end();
        } catch {}
        // "Tenant or user not found" => wrong region, keep probing.
        // Anything else (timeout, refused) => also try next.
      }
    }
  }
  throw new Error(
    `Could not connect via any pooler region. Last error: ${lastErr?.message}`
  );
}

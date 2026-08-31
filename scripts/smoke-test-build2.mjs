// Build 2 data-layer smoke test.
// Verifies: orders insert + read, activity_log written on a status change,
// newsletter filter (ok_to_contact), and the person-history joins. Cleans up.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const email = `smoke2+${Date.now()}@example.com`;
let ok = true;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
  if (!cond) ok = false;
};

// Seed a person + one inquiry.
const { data: person } = await supabase
  .from('people')
  .insert({
    email,
    name: 'Pipeline Tester',
    company: 'Testco',
    source_site: 'test',
    ok_to_contact: true,
    attributes: { org_size: '201–1000', payroll_system: 'SAP' },
  })
  .select('id')
  .single();

const { data: contact } = await supabase
  .from('contacts')
  .insert({
    person_id: person.id,
    type: 'consulting',
    subject: 'Pipeline test',
    status: 'new_lead',
    source: 'test',
  })
  .select('id, status')
  .single();

// --- Simulate a stage move (what updateContactStatus does).
const moves = [
  ['new_lead', 'contacted'],
  ['contacted', 'discovery_call'],
  ['discovery_call', 'proposal'],
  ['proposal', 'won'],
];
for (const [from, to] of moves) {
  await supabase.from('contacts').update({ status: to }).eq('id', contact.id);
  await supabase.from('activity_log').insert({
    contact_id: contact.id,
    person_id: person.id,
    from_status: from,
    to_status: to,
    actor: 'smoke@test',
    note: null,
  });
}

const { data: refreshed } = await supabase
  .from('contacts')
  .select('status')
  .eq('id', contact.id)
  .single();
check('contact advanced to won', refreshed.status === 'won');

const { data: log } = await supabase
  .from('activity_log')
  .select('from_status, to_status, actor')
  .eq('contact_id', contact.id)
  .order('created_at', { ascending: true });
check('activity_log has one row per move', log.length === moves.length);
check('activity_log records from/to', log[0].from_status === 'new_lead' && log[0].to_status === 'contacted');
check('activity_log records actor', log.every((r) => r.actor === 'smoke@test'));

// --- Orders
const { error: orderErr } = await supabase.from('orders').insert({
  person_id: person.id,
  product_name: 'Annual membership',
  amount_cents: 129900,
  currency: 'AUD',
  status: 'paid',
});
check('order insert ok', !orderErr);

const { data: orders } = await supabase
  .from('orders')
  .select('product_name, amount_cents, status, people ( email )')
  .eq('person_id', person.id);
check('order reads back with amount', orders[0]?.amount_cents === 129900);
check('order joins person', orders[0]?.people?.email === email);

// --- Order status constraint
const { error: badStatus } = await supabase
  .from('orders')
  .insert({ person_id: person.id, product_name: 'X', status: 'not_a_status' });
check('invalid order status rejected by DB', !!badStatus);

// --- Newsletter filter
const { data: subs } = await supabase
  .from('people')
  .select('id')
  .eq('ok_to_contact', true)
  .eq('id', person.id);
check('subscriber appears in newsletter filter', subs.length === 1);

// --- Cleanup (cascades to contacts, activity_log, orders)
await supabase.from('people').delete().eq('id', person.id);
console.log('\nCleaned up test rows.');
console.log(ok ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(ok ? 0 : 1);

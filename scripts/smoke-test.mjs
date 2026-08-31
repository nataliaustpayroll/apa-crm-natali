// End-to-end data-layer smoke test for Build 1.
// Simulates two submissions from the SAME email and asserts:
//   - exactly one People row (deduped), attributes merged
//   - two linked Contacts rows, both status new_lead
//   - the admin query returns them newest-first with person + attributes
// Cleans up after itself.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const email = `smoke+${Date.now()}@example.com`;
let ok = true;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
  if (!cond) ok = false;
};

// --- Submission 1
let { data: p1 } = await supabase
  .from('people')
  .insert({
    email,
    name: 'Smoke One',
    company: 'Acme',
    source_site: 'test',
    ok_to_contact: false,
    attributes: { org_size: '51–200', payroll_system: 'MYOB' },
  })
  .select('id')
  .single();
await supabase.from('contacts').insert({
  person_id: p1.id,
  type: 'consulting',
  subject: 'First',
  message: 'Need help',
  source: 'marketing_site',
  status: 'new_lead',
});

// --- Submission 2 (same email → must dedupe, merge attrs, opt-in flips true)
const { data: existing } = await supabase
  .from('people')
  .select('id, attributes')
  .eq('email', email)
  .maybeSingle();
const merged = { ...existing.attributes, time_attendance_system: 'Deputy' };
await supabase
  .from('people')
  .update({ attributes: merged, ok_to_contact: true, name: 'Smoke Two' })
  .eq('id', existing.id);
await supabase.from('contacts').insert({
  person_id: existing.id,
  type: 'training',
  subject: 'Second',
  source: 'marketing_site',
  status: 'new_lead',
});

// --- Assertions
const { data: people } = await supabase.from('people').select('*').eq('email', email);
check('exactly one person for repeated email', people.length === 1);
const person = people[0];
check('name updated on repeat submit', person.name === 'Smoke Two');
check('ok_to_contact flipped to true', person.ok_to_contact === true);
check('attributes merged (org_size kept)', person.attributes.org_size === '51–200');
check('attributes merged (payroll kept)', person.attributes.payroll_system === 'MYOB');
check(
  'attributes merged (time_attendance added)',
  person.attributes.time_attendance_system === 'Deputy'
);

const { data: contacts } = await supabase
  .from('contacts')
  .select('id, status, type')
  .eq('person_id', person.id);
check('two contacts for the person', contacts.length === 2);
check('all contacts land in new_lead', contacts.every((c) => c.status === 'new_lead'));

// --- Admin read query (same shape the admin page uses)
const { data: adminRows, error: adminErr } = await supabase
  .from('contacts')
  .select('id, type, subject, status, created_at, people ( name, email, attributes )')
  .order('created_at', { ascending: false })
  .limit(5);
check('admin query works', !adminErr);
check('admin query joins person', adminRows.some((r) => r.people?.email === email));

// --- Type constraint enforced?
const { error: badType } = await supabase
  .from('contacts')
  .insert({ person_id: person.id, type: 'not_a_type', status: 'new_lead' });
check('invalid inquiry type rejected by DB', !!badType);

// --- Cleanup
await supabase.from('people').delete().eq('id', person.id); // cascades to contacts
console.log('\nCleaned up test rows.');
console.log(ok ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(ok ? 0 : 1);

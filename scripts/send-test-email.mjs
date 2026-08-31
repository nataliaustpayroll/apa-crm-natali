// Live Resend check: sends one test email from the configured sender to the
// operator. Confirms the API key works AND the sending domain is verified.
// Usage: node scripts/send-test-email.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const key = process.env.RESEND_API_KEY;
const from =
  process.env.EMAIL_FROM ||
  'Australian Payroll Association <noreply@send.apa.com.au>';
const to = process.env.ADMIN_NOTIFY_EMAIL || 'natali@austpayroll.com.au';

if (!key) {
  console.error('RESEND_API_KEY is not set.');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: 'APA CRM — Resend test',
    html: `<p style="font-family:sans-serif">This is a test from your APA CRM Build 2 setup.</p>
           <p style="font-family:sans-serif">If you can read this, Resend is wired and <strong>${from}</strong> is verified.</p>`,
  }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`FAILED (${res.status}):`, JSON.stringify(data, null, 2));
  process.exit(1);
}
console.log('SENT — id:', data.id);
console.log(`from: ${from}`);
console.log(`to:   ${to}`);

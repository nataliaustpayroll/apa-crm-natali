import 'server-only';

// Resend email helpers — dependency-free, via the Resend REST API.
// Server only: RESEND_API_KEY must never reach the client.
//
// Env:
//   RESEND_API_KEY     — Resend API key (re_...)
//   EMAIL_FROM         — verified sender, e.g. "APA <noreply@send.apa.com.au>"
//   ADMIN_NOTIFY_EMAIL — where new-lead notifications go (the operator)

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const FROM =
  process.env.EMAIL_FROM ||
  'Australian Payroll Association <noreply@send.apa.com.au>';
const ADMIN_TO = process.env.ADMIN_NOTIFY_EMAIL || 'natali@austpayroll.com.au';

const BRAND = {
  blue: '#48608a',
  gold: '#f0bd18',
  navy: '#2a3850',
  grey: '#7f8897',
  bg: '#eff1f5',
  charcoal: '#3a3839',
};

const TYPE_LABELS = {
  consulting: 'Consulting',
  membership: 'Membership',
  training: 'Training',
  general: 'General',
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Low-level send. Never throws — returns { ok, id?, error? } so a failed email
// can never break a form submission.
async function send({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, error: 'RESEND_API_KEY is not set' };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || `Resend returned ${res.status}`,
      };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err?.message || 'network error' };
  }
}

function shell(bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Source Sans Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.charcoal};line-height:1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e7ee;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND.blue};height:4px;line-height:4px;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 40px;">
                <p style="text-transform:uppercase;letter-spacing:0.12em;font-size:12px;font-weight:600;color:${BRAND.blue};margin:0 0 20px;">
                  Australian Payroll Association
                </p>
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:20px auto 0;font-size:12px;color:${BRAND.grey};">
            © ${new Date().getFullYear()} Australian Payroll Association
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function heading(text) {
  return `<h1 style="font-family:'Montserrat',-apple-system,sans-serif;font-weight:600;color:${BRAND.navy};font-size:24px;line-height:1.25;margin:0 0 16px;">${esc(
    text
  )}</h1>`;
}

// Sent to the person who submitted the form.
export async function sendConfirmationEmail(lead) {
  const name = lead.name ? lead.name.split(' ')[0] : 'there';
  const typeLabel = TYPE_LABELS[lead.type] || 'inquiry';
  const html = shell(`
    ${heading('Thank you for your inquiry')}
    <p style="margin:0 0 16px;font-size:16px;">Hi ${esc(name)},</p>
    <p style="margin:0 0 16px;font-size:16px;">
      We&rsquo;ve received your ${esc(
        typeLabel.toLowerCase()
      )} inquiry and a member of the Australian Payroll
      Association team will be in touch shortly.
    </p>
    ${
      lead.subject || lead.message
        ? `<div style="background:${BRAND.bg};border-radius:10px;padding:16px 18px;margin:0 0 20px;">
             ${
               lead.subject
                 ? `<p style="margin:0 0 6px;font-size:14px;color:${BRAND.navy};font-weight:600;">${esc(
                     lead.subject
                   )}</p>`
                 : ''
             }
             ${
               lead.message
                 ? `<p style="margin:0;font-size:14px;color:${BRAND.charcoal};white-space:pre-wrap;">${esc(
                     lead.message
                   )}</p>`
                 : ''
             }
           </div>`
        : ''
    }
    <p style="margin:0;font-size:16px;">Kind regards,<br/>The Australian Payroll Association team</p>
  `);

  return send({
    to: lead.email,
    subject: 'We&rsquo;ve received your inquiry — Australian Payroll Association',
    html,
    replyTo: ADMIN_TO,
  });
}

// Sent to the operator when a new lead lands.
export async function sendAdminNotification(lead) {
  const typeLabel = TYPE_LABELS[lead.type] || lead.type;
  const rows = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Company', lead.company],
    ['Role', lead.role],
    ['Type', typeLabel],
    ['Subject', lead.subject],
    ['Org size', lead.attributes?.org_size],
    ['Payroll system', lead.attributes?.payroll_system],
    ['Time & attendance', lead.attributes?.time_attendance_system],
    ['Newsletter opt-in', lead.ok_to_contact ? 'Yes' : 'No'],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr>
           <td style="padding:6px 12px 6px 0;font-size:14px;color:${BRAND.grey};vertical-align:top;white-space:nowrap;">${esc(
             k
           )}</td>
           <td style="padding:6px 0;font-size:14px;color:${BRAND.charcoal};">${esc(
             v
           )}</td>
         </tr>`
    )
    .join('');

  const html = shell(`
    ${heading(`New ${esc(typeLabel.toLowerCase())} lead`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      ${rows}
    </table>
    ${
      lead.message
        ? `<div style="background:${BRAND.bg};border-radius:10px;padding:16px 18px;margin:0 0 20px;">
             <p style="margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.grey};">Message</p>
             <p style="margin:0;font-size:14px;white-space:pre-wrap;">${esc(
               lead.message
             )}</p>
           </div>`
        : ''
    }
    ${
      process.env.NEXT_PUBLIC_SITE_URL
        ? `<a href="${esc(
            process.env.NEXT_PUBLIC_SITE_URL
          )}/admin/contacts" style="display:inline-block;background:${BRAND.blue};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">Open the pipeline</a>`
        : ''
    }
  `);

  return send({
    to: ADMIN_TO,
    subject: `New ${typeLabel} lead: ${lead.name || lead.email}`,
    html,
    replyTo: lead.email,
  });
}

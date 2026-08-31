import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logout } from './auth-actions';

export const metadata = { title: 'Leads · APA CRM' };
export const dynamic = 'force-dynamic';

const TYPE_LABELS = {
  consulting: 'Consulting',
  membership: 'Membership',
  training: 'Training',
  general: 'General',
};

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default async function AdminLeadsPage() {
  // Defence-in-depth: middleware already gates this, confirm the session too.
  const auth = await supabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();

  const supabase = supabaseAdmin();
  const { data: leads, error } = await supabase
    .from('contacts')
    .select(
      'id, type, subject, message, status, created_at, people ( name, email, phone, company, role, attributes )'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <main>
      <header className="admin-bar">
        <div className="container admin-bar-inner">
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>
              APA CRM
            </p>
            <h1 style={{ fontSize: 24, margin: 0 }}>Incoming leads</h1>
          </div>
          <div className="admin-user">
            {user?.email && <span>{user.email}</span>}
            <form action={logout}>
              <button className="btn-ghost" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="container" style={{ padding: '32px 24px 80px' }}>
        {error && (
          <div className="notice error">Could not load leads: {error.message}</div>
        )}

        {!error && (!leads || leads.length === 0) && (
          <div className="card">
            <p style={{ margin: 0, color: 'var(--apa-grey)' }}>
              No leads yet. Submit the contact form on the home page and it will
              appear here.
            </p>
          </div>
        )}

        {leads && leads.length > 0 && (
          <>
            <p style={{ color: 'var(--apa-grey)', marginTop: 0 }}>
              {leads.length} lead{leads.length === 1 ? '' : 's'}, newest first.
            </p>
            <div className="leads">
              {leads.map((lead) => {
                const p = lead.people || {};
                const attrs = p.attributes || {};
                return (
                  <article className="lead-card" key={lead.id}>
                    <div className="lead-head">
                      <div>
                        <h3 className="lead-name">{p.name || '(no name)'}</h3>
                        <div className="lead-meta">
                          <a href={`mailto:${p.email}`}>{p.email}</a>
                          {p.company && <span> · {p.company}</span>}
                          {p.role && <span> · {p.role}</span>}
                          {p.phone && <span> · {p.phone}</span>}
                        </div>
                      </div>
                      <div className="lead-badges">
                        <span className="badge badge-type">
                          {TYPE_LABELS[lead.type] || lead.type}
                        </span>
                        <span className="badge badge-status">
                          {lead.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {lead.subject && (
                      <p className="lead-subject">{lead.subject}</p>
                    )}
                    {lead.message && <p className="lead-message">{lead.message}</p>}

                    {(attrs.org_size ||
                      attrs.payroll_system ||
                      attrs.time_attendance_system) && (
                      <div className="lead-attrs">
                        {attrs.org_size && (
                          <span className="attr">
                            <strong>Org size:</strong> {attrs.org_size}
                          </span>
                        )}
                        {attrs.payroll_system && (
                          <span className="attr">
                            <strong>Payroll:</strong> {attrs.payroll_system}
                          </span>
                        )}
                        {attrs.time_attendance_system && (
                          <span className="attr">
                            <strong>Time &amp; attendance:</strong>{' '}
                            {attrs.time_attendance_system}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="lead-date">{fmtDate(lead.created_at)}</div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

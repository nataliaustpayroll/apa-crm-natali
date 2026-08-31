import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminNav from '../../AdminNav';
import { setOkToContact } from '../../actions';
import OrderForm from './OrderForm';

export const dynamic = 'force-dynamic';

const TYPE_LABELS = {
  consulting: 'Consulting',
  membership: 'Membership',
  training: 'Training',
  general: 'General',
};

const STATUS_LABELS = {
  new_lead: 'New lead',
  contacted: 'Contacted',
  discovery_call: 'Discovery call',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function fmtMoney(cents, currency = 'AUD') {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(
      (cents || 0) / 100
    );
  } catch {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  }
}

export default async function PersonDetailPage({ params }) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: person, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return (
      <main>
        <AdminNav active="people" />
        <section className="container admin-section">
          <div className="notice error">Could not load person: {error.message}</div>
        </section>
      </main>
    );
  }
  if (!person) notFound();

  const [{ data: contacts }, { data: activity }, { data: orders }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, type, subject, message, status, created_at')
      .eq('person_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_log')
      .select('id, from_status, to_status, actor, note, created_at')
      .eq('person_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, product_name, amount_cents, currency, status, created_at')
      .eq('person_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const a = person.attributes || {};

  return (
    <main>
      <AdminNav active="people" />
      <section className="container admin-section">
        <Link href="/admin/people" className="back-link">
          ← All people
        </Link>
        <div className="detail-head">
          <div>
            <h1 className="admin-h1" style={{ marginBottom: 4 }}>
              {person.name || '(no name)'}
            </h1>
            <p className="admin-subtle" style={{ margin: 0 }}>
              <a href={`mailto:${person.email}`}>{person.email}</a>
              {person.phone && <span> · {person.phone}</span>}
            </p>
          </div>
          <form action={setOkToContact}>
            <input type="hidden" name="person_id" value={person.id} />
            <input type="hidden" name="value" value={person.ok_to_contact ? 'false' : 'true'} />
            <button className="btn-ghost" type="submit">
              {person.ok_to_contact ? 'Remove from newsletter' : 'Add to newsletter'}
            </button>
          </form>
        </div>

        {/* Profile */}
        <div className="card detail-card">
          <dl className="detail-grid">
            <div>
              <dt>Company</dt>
              <dd>{person.company || '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{person.role || '—'}</dd>
            </div>
            <div>
              <dt>Org size</dt>
              <dd>{a.org_size || '—'}</dd>
            </div>
            <div>
              <dt>Payroll system</dt>
              <dd>{a.payroll_system || '—'}</dd>
            </div>
            <div>
              <dt>Time &amp; attendance</dt>
              <dd>{a.time_attendance_system || '—'}</dd>
            </div>
            <div>
              <dt>Newsletter</dt>
              <dd>{person.ok_to_contact ? 'Subscribed' : 'No'}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{person.source_site || '—'}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{fmtDateTime(person.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Inquiries */}
        <h2 className="admin-h2">Inquiries ({(contacts || []).length})</h2>
        {(contacts || []).length === 0 && <p className="admin-subtle">No inquiries.</p>}
        <div className="leads">
          {(contacts || []).map((c) => (
            <article className="lead-card" key={c.id}>
              <div className="lead-head">
                <div>
                  <span className="badge badge-type">{TYPE_LABELS[c.type] || c.type}</span>
                  {c.subject && <p className="lead-subject">{c.subject}</p>}
                </div>
                <span className="badge badge-status">
                  {STATUS_LABELS[c.status] || c.status}
                </span>
              </div>
              {c.message && <p className="lead-message">{c.message}</p>}
              <div className="lead-date">{fmtDateTime(c.created_at)}</div>
            </article>
          ))}
        </div>

        {/* Activity history */}
        <h2 className="admin-h2">Status history ({(activity || []).length})</h2>
        {(activity || []).length === 0 && (
          <p className="admin-subtle">No status changes yet.</p>
        )}
        {(activity || []).length > 0 && (
          <ul className="timeline">
            {(activity || []).map((ev) => (
              <li key={ev.id} className="timeline-item">
                <span className="timeline-dot" />
                <div>
                  <p className="timeline-text">
                    {ev.from_status ? (
                      <>
                        <span className="mono">{STATUS_LABELS[ev.from_status] || ev.from_status}</span>
                        {' → '}
                        <span className="mono">{STATUS_LABELS[ev.to_status] || ev.to_status}</span>
                      </>
                    ) : (
                      <span className="mono">{STATUS_LABELS[ev.to_status] || ev.to_status}</span>
                    )}
                    {ev.actor && <span className="timeline-actor"> by {ev.actor}</span>}
                  </p>
                  {ev.note && <p className="timeline-note">{ev.note}</p>}
                  <p className="timeline-date">{fmtDateTime(ev.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Orders */}
        <h2 className="admin-h2">Orders ({(orders || []).length})</h2>
        {(orders || []).length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product / service</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(orders || []).map((o) => (
                  <tr key={o.id}>
                    <td>{o.product_name}</td>
                    <td className="nowrap">{fmtMoney(o.amount_cents, o.currency)}</td>
                    <td>
                      <span className={`badge badge-order badge-order-${o.status}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="nowrap">{fmtDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card detail-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 18 }}>Add an order</h3>
          <OrderForm personId={person.id} />
        </div>
      </section>
    </main>
  );
}

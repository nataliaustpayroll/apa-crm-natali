import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminNav from '../AdminNav';
import { CONTACT_STATUSES } from '../constants';
import StatusSelect from './StatusSelect';

export const metadata = { title: 'Pipeline · APA CRM' };
export const dynamic = 'force-dynamic';

const STATUS_LABELS = {
  new_lead: 'New lead',
  contacted: 'Contacted',
  discovery_call: 'Discovery call',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

const TYPE_LABELS = {
  consulting: 'Consulting',
  membership: 'Membership',
  training: 'Training',
  general: 'General',
};

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export default async function PipelinePage() {
  const supabase = supabaseAdmin();
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(
      'id, type, subject, message, status, created_at, person_id, people ( name, email, company )'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  const byStatus = Object.fromEntries(CONTACT_STATUSES.map((s) => [s, []]));
  (contacts || []).forEach((c) => {
    if (byStatus[c.status]) byStatus[c.status].push(c);
  });

  return (
    <main>
      <AdminNav active="contacts" />
      <section className="container admin-section admin-section-wide">
        <h1 className="admin-h1">Pipeline</h1>
        {error && (
          <div className="notice error">Could not load inquiries: {error.message}</div>
        )}
        <p className="admin-subtle">
          {(contacts || []).length} inquir{(contacts || []).length === 1 ? 'y' : 'ies'}.
          Change the stage on any card to move it — every change is logged.
        </p>

        <div className="board">
          {CONTACT_STATUSES.map((s) => (
            <div className="board-col" key={s}>
              <div className="board-col-head">
                <span>{STATUS_LABELS[s]}</span>
                <span className="board-col-count">{byStatus[s].length}</span>
              </div>
              <div className="board-col-body">
                {byStatus[s].length === 0 && (
                  <p className="board-empty">—</p>
                )}
                {byStatus[s].map((c) => {
                  const p = c.people || {};
                  return (
                    <article className="board-card" key={c.id}>
                      <Link
                        href={`/admin/people/${c.person_id}`}
                        className="board-card-name"
                      >
                        {p.name || p.email || '(no name)'}
                      </Link>
                      <div className="board-card-meta">
                        <span className="badge badge-type">
                          {TYPE_LABELS[c.type] || c.type}
                        </span>
                        {p.company && <span className="board-card-company">{p.company}</span>}
                      </div>
                      {c.subject && <p className="board-card-subject">{c.subject}</p>}
                      <div className="board-card-foot">
                        <span className="board-card-date">{fmtDate(c.created_at)}</span>
                        <StatusSelect contactId={c.id} status={c.status} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

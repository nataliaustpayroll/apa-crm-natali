import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminNav from './AdminNav';
import { CONTACT_STATUSES } from './constants';

export const metadata = { title: 'Overview · APA CRM' };
export const dynamic = 'force-dynamic';

const STATUS_LABELS = {
  new_lead: 'New leads',
  contacted: 'Contacted',
  discovery_call: 'Discovery call',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

function fmtMoney(cents, currency = 'AUD') {
  try {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
    }).format((cents || 0) / 100);
  } catch {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  }
}

async function count(supabase, table, filter) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c || 0;
}

export default async function AdminOverviewPage() {
  const supabase = supabaseAdmin();

  const [peopleCount, newsletterCount, contacts, orders] = await Promise.all([
    count(supabase, 'people'),
    count(supabase, 'people', (q) => q.eq('ok_to_contact', true)),
    supabase.from('contacts').select('status'),
    supabase.from('orders').select('amount_cents, currency, status'),
  ]);

  const byStatus = Object.fromEntries(CONTACT_STATUSES.map((s) => [s, 0]));
  (contacts.data || []).forEach((c) => {
    if (byStatus[c.status] != null) byStatus[c.status] += 1;
  });
  const totalInquiries = (contacts.data || []).length;

  const orderRows = orders.data || [];
  const paidCents = orderRows
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  const stats = [
    { label: 'People', value: peopleCount, href: '/admin/people' },
    { label: 'Inquiries', value: totalInquiries, href: '/admin/contacts' },
    { label: 'Orders', value: orderRows.length, href: '/admin/orders' },
    { label: 'Newsletter', value: newsletterCount, href: '/admin/newsletter' },
    { label: 'Revenue (paid)', value: fmtMoney(paidCents), href: '/admin/orders' },
  ];

  return (
    <main>
      <AdminNav active="overview" />
      <section className="container admin-section">
        <h1 className="admin-h1">Overview</h1>

        <div className="stat-grid">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="stat-card">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </Link>
          ))}
        </div>

        <h2 className="admin-h2">Pipeline</h2>
        <div className="pipeline-summary">
          {CONTACT_STATUSES.map((s) => (
            <Link key={s} href="/admin/contacts" className="pipeline-summary-item">
              <span className="pipeline-summary-count">{byStatus[s]}</span>
              <span className="pipeline-summary-label">{STATUS_LABELS[s]}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

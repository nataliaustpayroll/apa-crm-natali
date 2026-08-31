import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminNav from '../AdminNav';

export const metadata = { title: 'Orders · APA CRM' };
export const dynamic = 'force-dynamic';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { dateStyle: 'medium' });
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

export default async function OrdersPage() {
  const supabase = supabaseAdmin();
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, product_name, amount_cents, currency, status, created_at, person_id, people ( name, email )'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  const paidCents = (orders || [])
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  return (
    <main>
      <AdminNav active="orders" />
      <section className="container admin-section admin-section-wide">
        <h1 className="admin-h1">Orders</h1>
        {error && (
          <div className="notice error">Could not load orders: {error.message}</div>
        )}

        {!error && (!orders || orders.length === 0) && (
          <div className="card">
            <p style={{ margin: 0, color: 'var(--apa-grey)' }}>
              No orders yet. Add one from a person&rsquo;s record.
            </p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <>
            <p className="admin-subtle">
              {orders.length} order{orders.length === 1 ? '' : 's'} · {fmtMoney(paidCents)} paid.
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Product / service</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const p = o.people || {};
                    return (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/admin/people/${o.person_id}`} className="table-link">
                            {p.name || p.email || '(unknown)'}
                          </Link>
                        </td>
                        <td>{o.product_name}</td>
                        <td className="nowrap">{fmtMoney(o.amount_cents, o.currency)}</td>
                        <td>
                          <span className={`badge badge-order badge-order-${o.status}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="nowrap">{fmtDate(o.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

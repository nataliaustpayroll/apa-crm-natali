import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminNav from '../AdminNav';
import { setOkToContact } from '../actions';

export const metadata = { title: 'Newsletter · APA CRM' };
export const dynamic = 'force-dynamic';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export default async function NewsletterPage() {
  const supabase = supabaseAdmin();
  const { data: people, error } = await supabase
    .from('people')
    .select('id, name, email, company, created_at')
    .eq('ok_to_contact', true)
    .order('created_at', { ascending: false })
    .limit(1000);

  return (
    <main>
      <AdminNav active="newsletter" />
      <section className="container admin-section admin-section-wide">
        <h1 className="admin-h1">Newsletter</h1>
        <p className="admin-subtle">
          Everyone who opted in (ok_to_contact = true).
        </p>
        {error && (
          <div className="notice error">Could not load the list: {error.message}</div>
        )}

        {!error && (!people || people.length === 0) && (
          <div className="card">
            <p style={{ margin: 0, color: 'var(--apa-grey)' }}>
              No subscribers yet.
            </p>
          </div>
        )}

        {people && people.length > 0 && (
          <>
            <p className="admin-subtle">
              {people.length} subscriber{people.length === 1 ? '' : 's'}.
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Since</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/admin/people/${p.id}`} className="table-link">
                          {p.name || '(no name)'}
                        </Link>
                      </td>
                      <td>{p.email}</td>
                      <td>{p.company || '—'}</td>
                      <td className="nowrap">{fmtDate(p.created_at)}</td>
                      <td>
                        <form action={setOkToContact}>
                          <input type="hidden" name="person_id" value={p.id} />
                          <input type="hidden" name="value" value="false" />
                          <button className="btn-ghost btn-sm" type="submit">
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

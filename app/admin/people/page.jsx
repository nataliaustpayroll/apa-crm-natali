import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminNav from '../AdminNav';

export const metadata = { title: 'People · APA CRM' };
export const dynamic = 'force-dynamic';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export default async function PeoplePage({ searchParams }) {
  const params = (await searchParams) || {};
  const q = (params.q || '').trim();

  const supabase = supabaseAdmin();
  let query = supabase
    .from('people')
    .select('id, name, email, company, role, ok_to_contact, attributes, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `name.ilike.${like},email.ilike.${like},company.ilike.${like},role.ilike.${like}`
    );
  }

  const { data: people, error } = await query;

  return (
    <main>
      <AdminNav active="people" />
      <section className="container admin-section admin-section-wide">
        <h1 className="admin-h1">People</h1>

        <form method="get" className="search-bar">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, email, company, role…"
            className="search-input"
            aria-label="Search people"
          />
          <button className="btn" type="submit">
            Search
          </button>
          {q && (
            <Link href="/admin/people" className="btn-ghost">
              Clear
            </Link>
          )}
        </form>

        {error && (
          <div className="notice error">Could not load people: {error.message}</div>
        )}

        {!error && (!people || people.length === 0) && (
          <div className="card">
            <p style={{ margin: 0, color: 'var(--apa-grey)' }}>
              {q ? `No people match “${q}”.` : 'No people yet.'}
            </p>
          </div>
        )}

        {people && people.length > 0 && (
          <>
            <p className="admin-subtle">
              {people.length} {people.length === 1 ? 'person' : 'people'}
              {q ? ` matching “${q}”` : ''}.
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Org size</th>
                    <th>Payroll</th>
                    <th>News</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => {
                    const a = p.attributes || {};
                    return (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/admin/people/${p.id}`} className="table-link">
                            {p.name || '(no name)'}
                          </Link>
                        </td>
                        <td>{p.email}</td>
                        <td>{p.company || '—'}</td>
                        <td>{p.role || '—'}</td>
                        <td>{a.org_size || '—'}</td>
                        <td>{a.payroll_system || '—'}</td>
                        <td>{p.ok_to_contact ? 'Yes' : '—'}</td>
                        <td className="nowrap">{fmtDate(p.created_at)}</td>
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

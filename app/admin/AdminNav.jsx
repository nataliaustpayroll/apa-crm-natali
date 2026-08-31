import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';
import { logout } from './auth-actions';

const LINKS = [
  { href: '/admin', label: 'Overview', key: 'overview' },
  { href: '/admin/contacts', label: 'Pipeline', key: 'contacts' },
  { href: '/admin/people', label: 'People', key: 'people' },
  { href: '/admin/orders', label: 'Orders', key: 'orders' },
  { href: '/admin/newsletter', label: 'Newsletter', key: 'newsletter' },
];

// Shared top bar for every authenticated /admin page.
export default async function AdminNav({ active }) {
  const auth = await supabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();

  return (
    <header className="admin-bar">
      <div className="container admin-bar-inner">
        <div className="admin-brand">
          <p className="eyebrow" style={{ marginBottom: 2 }}>
            APA CRM
          </p>
          <nav className="admin-nav">
            {LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={l.key === active ? 'admin-nav-link is-active' : 'admin-nav-link'}
              >
                {l.label}
              </Link>
            ))}
          </nav>
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
  );
}

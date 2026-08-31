import LoginForm from './LoginForm';

export const metadata = { title: 'Admin sign in · APA CRM' };

export default function LoginPage() {
  return (
    <main className="form-section" style={{ paddingTop: 96 }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <p className="eyebrow">APA CRM</p>
        <div className="card">
          <h2>Admin sign in</h2>
          <p className="sub">Sign in to view incoming leads.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

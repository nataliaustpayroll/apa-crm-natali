import ContactForm from './ContactForm';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">Australian Payroll Association</p>
          <h1>Payroll expertise your team can rely on.</h1>
          <p className="lede">
            Consulting, training, and membership for payroll and finance leaders.
            Tell us what you need and we&rsquo;ll get back to you.
          </p>
        </div>
      </section>

      <section className="form-section">
        <div className="container">
          <div className="card">
            <h2>Make an inquiry</h2>
            <p className="sub">
              Fields marked <span className="req">*</span> are required.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="site">
        <div className="container">
          © {new Date().getFullYear()} Australian Payroll Association
        </div>
      </footer>
    </main>
  );
}

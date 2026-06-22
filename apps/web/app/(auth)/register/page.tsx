import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">L</span> LoreHub
        </div>
        <section className="panel" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Create your account</h1>
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>Start collaborating on binary-first repositories.</p>
          </div>
          <form className="form-grid">
            <div className="field">
              <label htmlFor="display-name">Display name</label>
              <input id="display-name" name="display-name" placeholder="Rin Tanaka" type="text" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" placeholder="rin" type="text" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" placeholder="rin@studio.dev" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" placeholder="Choose a strong password" type="password" autoComplete="new-password" required />
              <span className="muted" style={{ fontSize: "0.78rem" }}>At least 12 characters, including a number and a symbol.</span>
            </div>
            <button className="button" type="submit">Create account</button>
          </form>
          <div className="auth-divider">or sign up with</div>
          <div className="sso-card-list">
            <Link className="button-secondary" href="/sso?provider=oidc-google-workspace">Google Workspace (OIDC)</Link>
            <Link className="button-secondary" href="/sso?provider=saml-acme">Enterprise SAML</Link>
          </div>
        </section>
        <p className="auth-foot">Already have an account? <Link className="inline-link" href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}

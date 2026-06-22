import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">L</span> LoreHub
        </div>
        <section className="panel" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Sign in</h1>
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>Welcome back. Use your email or an enterprise provider.</p>
          </div>
          <form className="form-grid">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" placeholder="team@studio.dev" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <div className="meta-row" style={{ justifyContent: "space-between" }}>
                <label htmlFor="password">Password</label>
                <Link className="inline-link" href="/login" style={{ fontSize: "0.82rem" }}>Forgot?</Link>
              </div>
              <input id="password" name="password" placeholder="Enter your password" type="password" autoComplete="current-password" required />
            </div>
            <button className="button" type="submit">Sign in</button>
          </form>
          <div className="auth-divider">or continue with</div>
          <div className="sso-card-list">
            <Link className="button-secondary" href="/sso?provider=oidc-google-workspace">Google Workspace (OIDC)</Link>
            <Link className="button-secondary" href="/sso?provider=saml-acme">Enterprise SAML</Link>
          </div>
        </section>
        <p className="auth-foot">New to LoreHub? <Link className="inline-link" href="/register">Create an account</Link></p>
      </div>
    </div>
  );
}

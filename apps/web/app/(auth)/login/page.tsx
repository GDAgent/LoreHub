import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="shell page">
      <section className="panel form-card">
        <h1>Log in</h1>
        <p className="muted">
          Auth pages now include enterprise sign-in entry points so OIDC and SAML can coexist
          with the built-in email flow.
        </p>
        <form className="form-grid">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="team@studio.dev" type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" placeholder="Enter your password" type="password" />
          </div>
          <button className="button" type="submit">
            Continue
          </button>
        </form>
        <div className="sso-card-list top-gap">
          <Link className="button-secondary" href="/sso?provider=oidc-google-workspace">
            Continue with Google Workspace
          </Link>
          <Link className="button-secondary" href="/sso?provider=saml-acme">
            Continue with enterprise SAML
          </Link>
        </div>
        <p className="muted">
          Need an account? <Link href="/register">Create one</Link>.
        </p>
      </section>
    </main>
  );
}

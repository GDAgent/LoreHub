import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="shell page">
      <section className="panel form-card">
        <h1>Log in</h1>
        <p className="muted">
          Auth pages are wired into the app router now so Phase 1 can layer in username,
          OAuth, and organization-aware access control without reshaping navigation.
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
        <p className="muted">
          Need an account? <Link href="/register">Create one</Link>.
        </p>
      </section>
    </main>
  );
}

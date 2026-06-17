import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="shell page">
      <section className="panel form-card">
        <h1>Create an account</h1>
        <p className="muted">
          The registration shell gives the product a stable route structure before real
          auth providers and invitation flows land.
        </p>
        <form className="form-grid">
          <div className="field">
            <label htmlFor="display-name">Display name</label>
            <input id="display-name" name="display-name" placeholder="Rin Tanaka" type="text" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="rin@studio.dev" type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" placeholder="Choose a strong password" type="password" />
          </div>
          <button className="button" type="submit">
            Create account
          </button>
        </form>
        <p className="muted">
          Already registered? <Link href="/login">Log in</Link>.
        </p>
      </section>
    </main>
  );
}

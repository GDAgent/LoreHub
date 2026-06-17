import { billingInvoices, billingMetrics } from "@/lib/demo-enterprise";

export default function CloudBillingPage() {
  return (
    <main className="shell page">
      <section className="panel">
        <div className="repo-path">admin / cloud</div>
        <h1>Cloud billing</h1>
        <p className="muted">
          Billing integrates plan usage, seats, storage, and invoice status so LoreHub Cloud can tie platform metrics directly to customer billing.
        </p>
      </section>

      <section className="grid two top-gap">
        <article className="panel">
          <h2>Usage metrics</h2>
          <div className="grid two top-gap-sm">
            {billingMetrics.map((metric) => (
              <div key={metric.label} className="stat">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
                <p className="muted top-gap-sm">{metric.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Invoices</h2>
          <div className="comment-thread top-gap-sm">
            {billingInvoices.map((invoice) => (
              <article key={invoice.id} className="comment-card">
                <div className="section-header">
                  <div>
                    <div className="meta-row">
                      <span className="pill">{invoice.id}</span>
                      <span className={`pill ${invoice.status === "paid" ? "success-pill" : "warn-pill"}`}>{invoice.status}</span>
                    </div>
                    <h3>{invoice.amount}</h3>
                  </div>
                  <span className="muted">{invoice.period}</span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

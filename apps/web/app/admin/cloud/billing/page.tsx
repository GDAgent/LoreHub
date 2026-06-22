import { AdminTabs } from "@/components/admin-tabs";
import { billingInvoices, billingMetrics } from "@/lib/demo-enterprise";

export default function CloudBillingPage() {
  return (
    <main className="shell page">
      <section>
        <div className="eyebrow">Administration</div>
        <AdminTabs active="billing" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Cloud billing</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Plan usage, seats, storage, and invoice status — tying platform metrics directly to billing.</p>
        </div>
        <button className="button-secondary" type="button">Manage plan</button>
      </div>

      <section className="grid four">
        {billingMetrics.map((metric) => (
          <article key={metric.label} className="panel stat-panel">
            <span className="muted">{metric.label}</span>
            <strong>{metric.value}</strong>
            <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.82rem" }}>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Invoices</h2>
        <table className="table">
          <thead>
            <tr><th>Invoice</th><th>Period</th><th style={{ textAlign: "right" }}>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {billingInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td><code style={{ fontSize: "0.82rem" }}>{invoice.id}</code></td>
                <td className="muted">{invoice.period}</td>
                <td style={{ textAlign: "right" }}><strong>{invoice.amount}</strong></td>
                <td><span className={`pill ${invoice.status === "paid" ? "success-pill" : "warn-pill"}`}>{invoice.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

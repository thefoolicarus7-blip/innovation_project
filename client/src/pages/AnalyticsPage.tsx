import { useAppSelector } from "../store/hooks";

export function AnalyticsPage() {
  const analytics = useAppSelector((state) => state.portal.analytics);

  if (!analytics) {
    return (
      <section className="panel">
        <h2>Insights</h2>
        <p>
          No analytics available yet. Once you publish roles and receive
          applications, insights will appear here.
        </p>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <header className="section-head">
        <div>
          <h2>Performance Overview</h2>
          <p className="section-subtitle">
            A deep dive into your hiring efficiency and candidate flow.
          </p>
        </div>
      </header>

      <div className="summary-grid">
        <article className="stat-card">
          <h3>Total Listings</h3>
          <strong>{analytics.totalJobs}</strong>
        </article>
        <article className="stat-card">
          <h3>Active Roles</h3>
          <strong>{analytics.openJobs}</strong>
        </article>
        <article className="stat-card">
          <h3>Applications</h3>
          <strong>{analytics.totalApplications}</strong>
        </article>
        <article className="stat-card">
          <h3>Conversation Rate</h3>
          <strong>{analytics.conversionRate}%</strong>
        </article>
      </div>

      <div className="two-column">
        <section className="panel">
          <div className="section-head">
            <h2>Distribution</h2>
            <span className="pill">By Role</span>
          </div>
          <div className="analytics-list-container">
            <ul className="analytics-list">
              {analytics.applicationsByJob.map((entry) => (
                <li
                  key={entry.jobTitle}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{entry.jobTitle}</span>
                  <span
                    className="pill"
                    style={{ minWidth: "40px", textAlign: "center" }}
                  >
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h2>Recommendations</h2>
            <span className="pill">AI Assistant</span>
          </div>
          <div style={{ display: "grid", gap: "16px" }}>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)" }}>
              Based on your current conversion rate, we recommend optimizing the{" "}
              <strong>{analytics.applicationsByJob[0]?.jobTitle}</strong>{" "}
              listing with more visual media to attract 20% more candidates.
            </p>
            <div className="media-tile" style={{ height: "160px" }}>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800"
                alt="Analytics insight"
              />
              <span>Marketing Insight</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

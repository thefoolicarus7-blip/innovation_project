import { useEffect, useState, Fragment } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadUserApplications } from "../store/slices/userSlice";

type TabOption = "all" | "matches" | "let_it_go";

export function UserApplicationsPage() {
  const dispatch = useAppDispatch();
  const applications = useAppSelector((state: any) => state.user.applications);
  const loading = useAppSelector((state: any) => state.user.applicationsLoading);
  const [activeTab, setActiveTab] = useState<TabOption>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(loadUserApplications(activeTab));
  }, [dispatch, activeTab]);

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="section-head" style={{ marginBottom: "24px" }}>
          <h2>My Applications</h2>

          <div
            className="filter-tabs"
            style={{
              display: "flex",
              gap: "8px",
              background: "var(--muted-bg)",
              padding: "4px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <button
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
              style={{
                background: activeTab === "all" ? "var(--card)" : "transparent",
                border:
                  activeTab === "all"
                    ? "1px solid var(--border)"
                    : "1px solid transparent",
                padding: "6px 16px",
                borderRadius: "var(--radius-sm)",
                color:
                  activeTab === "all" ? "var(--foreground)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              All
            </button>
            <button
              className={`tab-btn ${activeTab === "matches" ? "active" : ""}`}
              onClick={() => setActiveTab("matches")}
              style={{
                background:
                  activeTab === "matches" ? "var(--card)" : "transparent",
                border:
                  activeTab === "matches"
                    ? "1px solid var(--border)"
                    : "1px solid transparent",
                padding: "6px 16px",
                borderRadius: "var(--radius-sm)",
                color:
                  activeTab === "matches" ? "var(--success)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              Accepted
            </button>
            <button
              className={`tab-btn ${activeTab === "let_it_go" ? "active" : ""}`}
              onClick={() => setActiveTab("let_it_go")}
              style={{
                background:
                  activeTab === "let_it_go" ? "var(--card)" : "transparent",
                border:
                  activeTab === "let_it_go"
                    ? "1px solid var(--border)"
                    : "1px solid transparent",
                padding: "6px 16px",
                borderRadius: "var(--radius-sm)",
                color:
                  activeTab === "let_it_go" ? "var(--danger)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              Rejected
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading your applications...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Applied On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app: any) => {
                  let statusClass = "pill ";
                  if (app.status === "Rejected") statusClass += "danger";
                  else if (
                    app.status === "Interview" ||
                    app.status === "Shortlisted"
                  )
                    statusClass += "success";

                  return (
                    <Fragment key={app.id}>
                      <tr 
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                        style={{ cursor: "pointer", background: expandedId === app.id ? "var(--muted-bg)" : "transparent" }}
                        title="Click to view more details"
                      >
                        <td style={{ fontWeight: 600 }}>{app.jobTitle}</td>
                        <td style={{ color: "var(--muted)" }}>
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={statusClass}
                            style={{
                              color:
                                app.status === "Rejected"
                                  ? "var(--danger)"
                                  : app.status === "Interview" ||
                                      app.status === "Shortlisted"
                                    ? "var(--success)"
                                    : "inherit",
                            }}
                          >
                            {app.status}
                          </span>
                        </td>
                      </tr>
                      {expandedId === app.id && app.jobDetails && app.companyDetails && (
                        <tr style={{ background: "var(--muted-bg)" }}>
                          <td colSpan={3} style={{ padding: "20px", borderTop: "none" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                              <div style={{ background: "var(--card)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                                <h4 style={{ margin: "0 0 12px 0", color: "var(--primary)" }}>Job Details</h4>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem" }}><strong style={{ color: "var(--muted)" }}>Location:</strong> {app.jobDetails.location}</p>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem" }}><strong style={{ color: "var(--muted)" }}>Type:</strong> {app.jobDetails.employmentType}</p>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem" }}><strong style={{ color: "var(--muted)" }}>Salary:</strong> {app.jobDetails.salaryRange}</p>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem" }}><strong style={{ color: "var(--muted)" }}>Experience:</strong> {app.jobDetails.experienceLevel}</p>
                                {app.jobDetails.requiredSkills && app.jobDetails.requiredSkills.length > 0 && (
                                  <div style={{ marginTop: "12px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                    {app.jobDetails.requiredSkills.map((s: string) => <span key={s} className="tag-pill" style={{fontSize: "0.75rem", padding: "2px 8px"}}>{s}</span>)}
                                  </div>
                                )}
                              </div>
                              <div style={{ background: "var(--card)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                                <h4 style={{ margin: "0 0 12px 0", color: "var(--primary)" }}>Company Profile</h4>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem" }}><strong style={{ color: "var(--muted)" }}>Name:</strong> {app.companyDetails.companyName}</p>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem" }}><strong style={{ color: "var(--muted)" }}>Industry:</strong> {app.companyDetails.industry}</p>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem" }}><strong style={{ color: "var(--muted)" }}>Location:</strong> {app.companyDetails.city}, {app.companyDetails.country}</p>
                                <p style={{ margin: "6px 0", fontSize: "0.9rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={app.companyDetails.about}>
                                  <strong style={{ color: "var(--muted)" }}>About:</strong> {app.companyDetails.about}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {applications.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ textAlign: "center", color: "var(--muted)" }}
                    >
                      No applications found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

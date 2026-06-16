import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadUserApplications } from "../store/slices/userSlice";

type TabOption = "all" | "matches" | "let_it_go";

export function UserApplicationsPage() {
  const dispatch = useAppDispatch();
  const applications = useAppSelector((state: any) => state.user.applications);
  const loading = useAppSelector((state: any) => state.user.applicationsLoading);
  const [activeTab, setActiveTab] = useState<TabOption>("all");

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
                    <tr key={app.id}>
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

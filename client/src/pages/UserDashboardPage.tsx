import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { applyToJobThunk } from "../store/slices/userSlice";

export function UserDashboardPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((state: any) => state.user.suggestedJobs);
  const dailyStats = useAppSelector((state: any) => state.user.dailyStats);
  const applications = useAppSelector((state: any) => state.user.applications);

  const appliedJobIds = useMemo(() => {
    return applications.map((app: any) => app.jobId);
  }, [applications]);

  const handleApply = (jobId: number) => {
    if (dailyStats && dailyStats.appliedToday >= dailyStats.applyLimit) {
      alert(
        "You have reached your daily apply limit of " +
          dailyStats.applyLimit +
          "!",
      );
      return;
    }
    void dispatch(applyToJobThunk(jobId));
  };

  const progressPercent = dailyStats
    ? (dailyStats.appliedToday / dailyStats.applyLimit) * 100
    : 0;

  return (
    <div className="page-stack">
      {dailyStats && (
        <section className="dashboard-hero">
          <div className="hero-content">
            <h2>Your Daily Progress</h2>
            <p>
              You have applied to {dailyStats.appliedToday} out of{" "}
              {dailyStats.applyLimit} jobs today. Keep going to discover more
              relevant roles!
            </p>

            <div
              className="progress-bar-container"
              style={{
                marginTop: "20px",
                background: "var(--muted-bg)",
                height: "12px",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                className="progress-bar"
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "var(--primary)",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
          </div>
        </section>
      )}

      <div className="panel">
        <div className="section-head">
          <h2>Suggested For You</h2>
          <span className="pill">{jobs?.length || 0} Open Roles</span>
        </div>

        <div
          className="job-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {jobs?.map((job: any, index: number) => {
            const hasApplied = appliedJobIds.includes(job.id);
            const isLimitReached =
              dailyStats && dailyStats.appliedToday >= dailyStats.applyLimit;

            return (
              <div
                key={`${job.id}-${index}`}
                className="job-card"
                style={{
                  padding: "24px",
                  background: "var(--card-raised)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "4px" }}>
                      {job.title}
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                      {job.location} • {job.employmentType}
                    </p>
                  </div>
                  {job.match && (
                    <span
                      style={{
                        background: "rgba(0, 108, 74, 0.1)",
                        color: "#006C4A",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        padding: "4px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      {job.match} Match
                    </span>
                  )}
                </div>

                <div className="tag-cloud">
                  {job.tags?.map((tag: string) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                  <span className="tag-pill">{job.salaryRange}</span>
                </div>

                <div style={{ marginTop: "auto", paddingTop: "16px" }}>
                  <button
                    className="primary-btn"
                    style={{ width: "100%" }}
                    onClick={() => handleApply(job.id)}
                    disabled={hasApplied || isLimitReached}
                  >
                    {hasApplied ? "Applied" : "Apply"}
                  </button>
                </div>
              </div>
            );
          })}

          {jobs?.length === 0 && (
            <p style={{ color: "var(--muted)" }}>No jobs found right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}

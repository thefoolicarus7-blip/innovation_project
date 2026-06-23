import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { applyToJobThunk, loadMyCv, loadUserJobs, loadUserApplications } from "../store/slices/userSlice";
import { calculateJobScore } from "../utils/jobMatch";
import type { Job, Candidate } from "../types";

export function UserDashboardPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((state: any) => state.user.suggestedJobs);
  const jobsLoading = useAppSelector((state: any) => state.user.jobsLoading);
  const jobsError = useAppSelector((state: any) => state.user.error);
  const applyError = useAppSelector((state: any) => state.user.applyError);
  const dailyStats = useAppSelector((state: any) => state.user.dailyStats);
  const applications = useAppSelector((state: any) => state.user.applications);
  const cv = useAppSelector((state: any) => state.user.cv) as Candidate | null;
  const cvLoading = useAppSelector((state: any) => state.user.cvLoading);

  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  useEffect(() => {
    if (!cv && !cvLoading) {
      void dispatch(loadMyCv());
    }
  }, [cv, cvLoading, dispatch]);

  useEffect(() => {
    void dispatch(loadUserJobs());
    void dispatch(loadUserApplications());
  }, [dispatch]);

  // Use compound key "ownerId-jobId" so applying to employer A's job #1 does NOT
  // mark employer B's job #1 as applied (they share the same numeric id but are different jobs)
  const appliedJobKeys = useMemo(() => {
    return new Set<string>(
      applications.map((app: any) => `${app.ownerId}-${app.jobId}`)
    );
  }, [applications]);

  const handleApply = (jobId: number, jobMongoId: string) => {
    if (dailyStats && dailyStats.appliedToday >= dailyStats.applyLimit) {
      alert(
        "You have reached your daily apply limit of " +
          dailyStats.applyLimit +
          "!",
      );
      return;
    }
    void dispatch(applyToJobThunk({ jobId, jobMongoId }));
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

        {applyError && (
          <p style={{ color: "var(--danger)", marginBottom: "12px" }}>
            Apply failed: {applyError}
          </p>
        )}

        <div
          className="job-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {jobs?.map((job: Job, index: number) => {
            const hasApplied = appliedJobKeys.has(`${job.ownerId}-${job.id}`);
            const isLimitReached =
              dailyStats && dailyStats.appliedToday >= dailyStats.applyLimit;

            const matchResult = calculateJobScore(cv, job);
            let badgeColor = "var(--danger)";
            let badgeBg = "rgba(239, 68, 68, 0.1)";
            if (matchResult.score >= 80) {
              badgeColor = "#006C4A";
              badgeBg = "rgba(0, 108, 74, 0.1)";
            } else if (matchResult.score >= 60) {
              badgeColor = "#B45309";
              badgeBg = "rgba(245, 158, 11, 0.1)";
            }

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
                  <div style={{ cursor: "pointer" }} onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}>
                    <span
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        padding: "4px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      {matchResult.score}% Match
                    </span>
                  </div>
                </div>

                {expandedJobId === job.id && (
                  <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "8px", fontSize: "0.85rem" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Matched Skills:</strong> {matchResult.matchedSkills.length > 0 ? matchResult.matchedSkills.join(", ") : "None"}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Missing Skills:</strong> {matchResult.missingSkills.length > 0 ? matchResult.missingSkills.join(", ") : "None"}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Education Match:</strong> {matchResult.educationMatch ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Experience Match:</strong> {matchResult.experienceMatch ? "Yes" : "No"}
                    </div>
                  </div>
                )}

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
                    onClick={() => handleApply(job.id, job._id)}
                    disabled={hasApplied || isLimitReached}
                  >
                    {hasApplied ? "Applied" : "Apply"}
                  </button>
                </div>
              </div>
            );
          })}

          {jobsLoading && (
            <p style={{ color: "var(--muted)" }}>Loading jobs...</p>
          )}

          {!jobsLoading && jobsError && jobs?.length === 0 && !dailyStats && (
            <p style={{ color: "var(--danger)" }}>Failed to load jobs. Please refresh the page.</p>
          )}

          {!jobsLoading && jobs?.length === 0 && (dailyStats || !jobsError) && (
            <p style={{ color: "var(--muted)" }}>No jobs found right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}

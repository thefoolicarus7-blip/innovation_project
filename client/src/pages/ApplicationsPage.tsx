import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  loadPortalData,
  patchApplicationStatusAsync,
  updateApplicationStatus,
} from "../store/slices/portalSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { JobApplication } from "../types";

const statuses: JobApplication["status"][] = [
  "New",
  "Shortlisted",
  "Interview",
  "Rejected",
];

export function ApplicationsPage() {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(
    (state: any) => state.portal.applications,
  ) as JobApplication[];
  const loading = useAppSelector((state: any) => state.portal.loading) as boolean;
  const error = useAppSelector((state: any) => state.portal.error) as string | null;

  const total = applications.length;
  const shortlist = useMemo(
    () => applications.filter((item) => item.status === "Shortlisted").length,
    [applications],
  );

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div className="hero-content">
          <h2>Candidate Pipeline</h2>
          <p>
            Track every journey. Review applicants, transition stages, and
            discover the talent that will shape the future of your team.
          </p>
        </div>
        <div className="hero-media-row">
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=600"
              alt="Candidates"
            />
            <span>Applicants</span>
          </div>
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600"
              alt="Interview"
            />
            <span>Shortlist</span>
          </div>
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600"
              alt="Decisions"
            />
            <span>Pipeline</span>
          </div>
        </div>
      </section>

      <div className="summary-grid">
        <article className="stat-card">
          <h3>Total Received</h3>
          <strong>{total}</strong>
        </article>
        <article className="stat-card">
          <h3>Shortlisted</h3>
          <strong>{shortlist}</strong>
        </article>
        <article className="stat-card">
          <h3>Interviews</h3>
          <strong>
            {applications.filter((a) => a.status === "Interview").length}
          </strong>
        </article>
      </div>

      <section className="panel">
        <div className="section-head">
          <h2>Active Applications</h2>
          <button
            className="secondary-btn"
            onClick={() => void dispatch(loadPortalData())}
            disabled={loading}
            style={{ fontSize: "0.85rem" }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "0.88rem", marginBottom: "12px" }}>
            Failed to load applications. Try refreshing.
          </p>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Applied</th>
                <th>Stage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>
                    No applications yet. Once candidates apply to your jobs, they will appear here.
                  </td>
                </tr>
              )}
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <div className="candidate-cell">
                      <div className="avatar">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(application.candidateName)}&background=18181b&color=fafafa`}
                          alt={application.candidateName}
                        />
                      </div>
                      <span style={{ fontWeight: 600 }}>
                        {application.candidateName}
                      </span>
                    </div>
                  </td>
                  <td>{application.jobTitle}</td>
                  <td>{application.appliedAt}</td>
                  <td>
                    <select
                      value={application.status}
                      className="pill"
                      style={{
                        background: "var(--muted-bg)",
                        border: "1px solid var(--border)",
                        padding: "4px 8px",
                        width: "auto",
                      }}
                      onChange={(event) => {
                        const nextStatus = event.target
                          .value as JobApplication["status"];
                        dispatch(
                          updateApplicationStatus({
                            applicationId: application.id,
                            status: nextStatus,
                          }),
                        );
                        void dispatch(
                          patchApplicationStatusAsync({
                            applicationId: application.id,
                            status: nextStatus,
                          }),
                        );
                      }}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Link
                      to={`/portal/candidates/${application.candidateId}`}
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.9rem",
                        textDecoration: "underline",
                      }}
                    >
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { Link, useParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export function CandidateProfilePage() {
  const { candidateId } = useParams();
  const candidate = useAppSelector((state) =>
    state.portal.candidates.find((item) => item.id === candidateId),
  );

  if (!candidate) {
    return (
      <section className="panel">
        <h2>Candidate not found</h2>
        <Link to="/portal/candidates">Back to candidates</Link>
      </section>
    );
  }

  const hasCV =
    candidate.fullName &&
    candidate.education &&
    candidate.summary &&
    candidate.skills?.length > 0;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-head">
          <h2>{candidate.fullName}</h2>
          <span className="pill">{candidate.yearsOfExperience} yr{candidate.yearsOfExperience !== 1 ? "s" : ""} experience</span>
        </div>
        <p className="section-subtitle">{candidate.summary}</p>

        <div className="profile-grid">
          <div>
            <h4>Email</h4>
            <p>{candidate.email}</p>
          </div>
          <div>
            <h4>Phone</h4>
            <p>{candidate.phone}</p>
          </div>
          <div>
            <h4>Experience</h4>
            <p>{candidate.yearsOfExperience} years</p>
          </div>
          <div>
            <h4>Education</h4>
            <p>{candidate.education}</p>
          </div>
        </div>

        <div className="section-head" style={{ marginTop: "16px" }}>
          <h3>Skills</h3>
        </div>
        <div className="chip-list">
          {candidate.skills.map((skill) => (
            <span className="chip" key={skill}>{skill}</span>
          ))}
        </div>

        {candidate.resumeUrl && (
          <a
            href={candidate.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="primary-btn inline-btn"
            style={{ marginTop: "16px", display: "inline-block" }}
          >
            View Uploaded Resume
          </a>
        )}
      </section>

      {hasCV && (
        <section className="panel">
          <div className="section-head" style={{ marginBottom: "20px" }}>
            <h2>Generated CV</h2>
            <span className="pill">Submitted with application</span>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "32px",
              background: "var(--card-raised)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ borderBottom: "2px solid var(--primary)", paddingBottom: "16px" }}>
              <h2 style={{ fontSize: "1.6rem", margin: 0 }}>{candidate.fullName}</h2>
              <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                {candidate.email}
                {candidate.phone ? ` · ${candidate.phone}` : ""}
              </p>
            </div>

            <div>
              <p
                style={{
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  color: "var(--muted)",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Professional Summary
              </p>
              <p style={{ lineHeight: 1.7 }}>{candidate.summary}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <p
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: "0.08em",
                    color: "var(--muted)",
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Experience
                </p>
                <p>{candidate.yearsOfExperience} year{candidate.yearsOfExperience !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: "0.08em",
                    color: "var(--muted)",
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Education
                </p>
                <p>{candidate.education}</p>
              </div>
            </div>

            <div>
              <p
                style={{
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  color: "var(--muted)",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Skills
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {candidate.skills.map((skill) => (
                  <span key={skill} className="tag-pill">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {!hasCV && (
        <section className="panel">
          <p style={{ color: "var(--muted)" }}>
            This candidate has not yet built a CV through the platform.
          </p>
        </section>
      )}
    </div>
  );
}

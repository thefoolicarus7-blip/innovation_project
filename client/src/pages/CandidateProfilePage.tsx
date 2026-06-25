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
          <h2>Candidate Documents</h2>
        </div>

        {candidate.resumeUrl && (
          <a
            href={candidate.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="primary-btn inline-btn"
            style={{ marginTop: "16px", display: "inline-block", marginRight: "8px" }}
          >
            View Uploaded Resume
          </a>
        )}
        {candidate.cvUrl && (
          <a
            href={candidate.cvUrl}
            target="_blank"
            rel="noreferrer"
            className="secondary-btn inline-btn"
            style={{ marginTop: "16px", display: "inline-block" }}
          >
            View Original CV
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
              <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "0.9rem" }}>
                {[candidate.email, candidate.phone].filter(Boolean).join(" · ")}
              </p>
              <p style={{ color: "var(--muted)", margin: "2px 0 0", fontSize: "0.85rem" }}>
                {[
                  candidate.dateOfBirth && `DOB: ${candidate.dateOfBirth}`,
                  candidate.gender && candidate.gender !== "Prefer not to say" && candidate.gender,
                  candidate.address,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>

            {candidate.summary && (
              <div>
                <h4 style={sectionTitle}>Professional Summary</h4>
                <p style={{ lineHeight: 1.7 }}>{candidate.summary}</p>
              </div>
            )}

            {candidate.workExperiences && candidate.workExperiences.filter((e) => e.jobTitle && e.company).length > 0 && (
              <div>
                <h4 style={sectionTitle}>Work Experience</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {candidate.workExperiences.filter((e) => e.jobTitle && e.company).map((exp, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700 }}>{exp.jobTitle}</span>
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                          {exp.startDate} – {exp.endDate || "Present"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{exp.company}</span>
                      {exp.description && (
                        <p style={{ marginTop: "4px", fontSize: "0.88rem", lineHeight: 1.6 }}>{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <h4 style={sectionTitle}>Total Experience</h4>
                <p>{candidate.yearsOfExperience} year{candidate.yearsOfExperience !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <h4 style={sectionTitle}>Education</h4>
                <p>{candidate.education}</p>
              </div>
            </div>

            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <h4 style={sectionTitle}>Skills</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {candidate.skills.map((skill) => (
                    <span key={skill} className="tag-pill">{skill}</span>
                  ))}
                </div>
              </div>
            )}
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

const sectionTitle: React.CSSProperties = {
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  color: "var(--muted)",
  marginBottom: "6px",
  fontWeight: 600,
};

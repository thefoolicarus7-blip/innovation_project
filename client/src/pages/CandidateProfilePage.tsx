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

  return (
    <section className="panel">
      <div className="section-head">
        <h2>{candidate.fullName}</h2>
        <span className="pill">{candidate.yearsOfExperience} years experience</span>
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

      <div className="section-head">
        <h3>Skills</h3>
      </div>
      <div className="chip-list">
        {candidate.skills.map((skill) => (
          <span className="chip" key={skill}>
            {skill}
          </span>
        ))}
      </div>

      {candidate.resumeUrl ? (
        <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="primary-btn inline-btn">
          View Resume
        </a>
      ) : (
        <p>No resume URL available</p>
      )}
    </section>
  );
}

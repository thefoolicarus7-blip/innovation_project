import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export function CandidatesPage() {
  const candidates = useAppSelector((state) => state.portal.candidates);

  return (
    <section className="panel">
      <div className="section-head">
        <h2>Candidates</h2>
        <span className="pill">{candidates.length} profiles</span>
      </div>
      <p className="section-subtitle">Review applicants and open detailed candidate profiles.</p>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Experience</th>
              <th>Skills</th>
              <th>Profile</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td>{candidate.fullName}</td>
                <td>{candidate.email}</td>
                <td>{candidate.yearsOfExperience} years</td>
                <td>{candidate.skills.join(", ")}</td>
                <td>
                  <Link to={`/portal/candidates/${candidate.id}`}>Open Profile</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

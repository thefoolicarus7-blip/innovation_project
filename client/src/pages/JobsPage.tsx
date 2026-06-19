import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addJob } from "../store/slices/portalSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { Job } from "../types";

const emptyForm: Omit<Job, "id" | "createdAt"> = {
  title: "",
  location: "",
  employmentType: "Full-time",
  salaryRange: "",
  status: "Open",
  deadline: "",
  tags: [],
  experienceLevel: "",
  requiredSkills: [],
  preferredEducation: "",
  requiredExperience: 0,
};

export function JobsPage() {
  const dispatch   = useAppDispatch();
  const user       = useAppSelector((state: any) => state.auth.user);
  const jobs       = useAppSelector((state: any) => state.portal.jobs) as Job[];
  const analytics  = useAppSelector((state: any) => state.portal.analytics);
  const isVerified = !!user?.isVerified;
  const [form, setForm] = useState(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  const openCount = useMemo(
    () => jobs.filter((job) => job.status === "Open").length,
    [jobs],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const finalTags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const finalSkills = skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    void dispatch(addJob({ ...form, tags: finalTags, requiredSkills: finalSkills }));
    setForm(emptyForm);
    setTagsInput("");
    setSkillsInput("");
  };

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div className="hero-content">
          <h2>Craft the next chapter of Career.</h2>
          <p>
            Your roles are more than just listings—they are invitations to join
            a community. Build beautiful, meaningful job posts that resonate
            with the right candidates.
          </p>
        </div>

        <div className="hero-media-row">
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800"
              alt="Team collaboration"
            />
            <span>Community</span>
          </div>
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800"
              alt="Modern office"
            />
            <span>Workspace</span>
          </div>
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800"
              alt="Strategy meeting"
            />
            <span>impact</span>
          </div>
        </div>
      </section>

      <div className="summary-grid">
        <article className="stat-card">
          <h3>Active Listings</h3>
          <strong>{jobs.length}</strong>
        </article>
        <article className="stat-card">
          <h3>Open Positions</h3>
          <strong>{openCount}</strong>
        </article>
        <article className="stat-card">
          <h3>Total Candidates</h3>
          <strong>{analytics?.totalApplications ?? 0}</strong>
        </article>
        <article className="stat-card">
          <h3>Conversion Rate</h3>
          <strong>{analytics?.conversionRate ?? 0}%</strong>
        </article>
      </div>

      {/* Verification gate banner — shown when company is not yet verified */}
      {!isVerified && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: "var(--radius-md)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}>
          <span style={{ fontSize: "1.2rem", lineHeight: 1, flexShrink: 0 }}>⚠</span>
          <div>
            <p style={{ fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>
              Company verification required
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: 10 }}>
              Please upload valid business registration documents before publishing job roles.
            </p>
            <Link to="/portal/company" className="secondary-btn" style={{ fontSize: "0.82rem", padding: "6px 14px", display: "inline-flex" }}>
              Upload Verification Documents →
            </Link>
          </div>
        </div>
      )}

      <div className="two-column">
        <section className="panel">
          <div className="section-head">
            <h2>Add Role</h2>
            <span className="pill">New Draft</span>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field-wrap">
              <label htmlFor="job-title">Job Title</label>
              <input
                id="job-title"
                placeholder="e.g. Creative Lead"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="job-location">Location</label>
              <input
                id="job-location"
                placeholder="e.g. Kathmandu, Hybrid"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>

            <div className="profile-grid">
              <div className="field-wrap">
                <label htmlFor="job-type">Type</label>
                <select
                  id="job-type"
                  value={form.employmentType}
                  onChange={(e) =>
                    setForm({ ...form, employmentType: e.target.value as any })
                  }
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div className="field-wrap">
                <label htmlFor="job-salary">Salary</label>
                <input
                  id="job-salary"
                  placeholder="e.g. $80k - $120k"
                  value={form.salaryRange}
                  onChange={(e) =>
                    setForm({ ...form, salaryRange: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="field-wrap">
              <label htmlFor="job-experience">Experience Level</label>
              <input
                id="job-experience"
                placeholder="e.g. 2-5 years, Senior"
                value={form.experienceLevel}
                onChange={(e) =>
                  setForm({ ...form, experienceLevel: e.target.value })
                }
                required
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="job-tags">Tags (comma separated)</label>
              <input
                id="job-tags"
                placeholder="e.g. Remote, Urgent, Startup"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="job-required-skills">Required Skills (comma separated)</label>
              <input
                id="job-required-skills"
                placeholder="e.g. React, Node.js, TypeScript"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="job-preferred-education">Preferred Education</label>
              <input
                id="job-preferred-education"
                placeholder="e.g. Bachelor's in Computer Science"
                value={form.preferredEducation}
                onChange={(e) => setForm({ ...form, preferredEducation: e.target.value })}
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="job-required-experience">Required Experience (Years)</label>
              <input
                id="job-required-experience"
                type="number"
                min="0"
                placeholder="e.g. 3"
                value={form.requiredExperience === 0 ? "" : form.requiredExperience}
                onChange={(e) => setForm({ ...form, requiredExperience: Number(e.target.value) })}
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="job-deadline">Application Deadline</label>
              <input
                id="job-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="job-status">Hiring Status</label>
              <select
                id="job-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as any })
                }
              >
                <option value="Open">Open</option>
                <option value="Paused">Paused</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={!isVerified}
              title={!isVerified ? "Company verification required before publishing" : undefined}
            >
              Publish Role
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-head">
            <h2>Live Directory</h2>
            <Link to="/portal/analytics" className="pill">
              View Analytics
            </Link>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Position & Experience</th>
                  <th>Location</th>
                  <th>Tags</th>
                  <th>Status</th>
                  <th>Applicants</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{job.title}</div>
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--muted)" }}
                      >
                        {job.employmentType} • {job.experienceLevel}
                      </div>
                    </td>
                    <td>{job.location}</td>
                    <td>
                      <div className="tag-cloud">
                        {job.tags?.map((tag) => (
                          <span key={tag} className="tag-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${job.status.toLowerCase()}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      {analytics?.applicationsByJob.find(
                        (a: any) => a.jobTitle === job.title,
                      )?.count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

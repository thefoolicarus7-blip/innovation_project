import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadMyCv, saveMyCvThunk } from "../store/slices/userSlice";
import { generateCVSummary } from "../services/api";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Personal Info", "Experience & Skills", "Summary", "Preview"];

export function CVBuilderPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const cv = useAppSelector((state: any) => state.user.cv);
  const cvSaving = useAppSelector((state: any) => state.user.cvSaving);
  const cvLoading = useAppSelector((state: any) => state.user.cvLoading);

  const [step, setStep] = useState<Step>(1);
  const [saved, setSaved] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    yearsOfExperience: 0,
    education: "",
    skillsRaw: "",
    summary: "",
  });

  useEffect(() => {
    void dispatch(loadMyCv());
  }, [dispatch]);

  useEffect(() => {
    if (cv) {
      setForm({
        fullName: cv.fullName ?? user?.name ?? "",
        email: cv.email ?? user?.email ?? "",
        phone: cv.phone ?? "",
        yearsOfExperience: cv.yearsOfExperience ?? 0,
        education: cv.education ?? "",
        skillsRaw: (cv.skills ?? []).join(", "),
        summary: cv.summary ?? "",
      });
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name ?? "",
        email: user.email ?? "",
      }));
    }
  }, [cv, user]);

  function set(key: keyof typeof form, value: string | number) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function parsedSkills(): string[] {
    return form.skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleGenerate() {
    const skills = parsedSkills();
    if (!form.fullName || !form.education || skills.length === 0) {
      setAiError("Please complete Steps 1 & 2 before generating a summary.");
      return;
    }
    setAiError(null);
    setAiGenerating(true);
    try {
      const summary = await generateCVSummary({
        fullName: form.fullName,
        yearsOfExperience: Number(form.yearsOfExperience),
        education: form.education,
        skills,
      });
      set("summary", summary);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSave() {
    const result = await dispatch(
      saveMyCvThunk({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        yearsOfExperience: Number(form.yearsOfExperience),
        education: form.education,
        skills: parsedSkills(),
        summary: form.summary,
      }),
    );
    if (saveMyCvThunk.fulfilled.match(result)) {
      setSaved(true);
    }
  }

  if (cvLoading) {
    return <div className="page-stack"><div className="panel"><p>Loading your CV…</p></div></div>;
  }

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="section-head" style={{ marginBottom: "28px" }}>
          <h2>CV Builder</h2>
          <span className="pill">{STEP_LABELS[step - 1]}</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const active = n === step;
            const done = n < step;
            return (
              <button
                key={label}
                onClick={() => setStep(n)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  borderRadius: "var(--radius-sm)",
                  border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: active ? "var(--primary)" : done ? "var(--muted-bg)" : "transparent",
                  color: active ? "#fff" : done ? "var(--foreground)" : "var(--muted)",
                  fontSize: "0.8rem",
                  fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                {i + 1}. {label}
              </button>
            );
          })}
        </div>

        {/* Step 1 – Personal Info */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Tell us the basics — this appears at the top of your CV.
            </p>
            <label style={labelStyle}>
              Full Name
              <input
                style={inputStyle}
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </label>
            <label style={labelStyle}>
              Email Address
              <input
                style={inputStyle}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="e.g. jane@example.com"
              />
            </label>
            <label style={labelStyle}>
              Phone Number
              <input
                style={inputStyle}
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. +27 82 123 4567"
              />
            </label>
            <div style={{ marginTop: "8px" }}>
              <button className="primary-btn" onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 – Experience & Skills */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Share your background so recruiters and job matching can find the right fit.
            </p>
            <label style={labelStyle}>
              Years of Experience
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.yearsOfExperience}
                onChange={(e) => set("yearsOfExperience", e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              Highest Education Level
              <input
                style={inputStyle}
                value={form.education}
                onChange={(e) => set("education", e.target.value)}
                placeholder="e.g. BSc Computer Science, University of Cape Town"
              />
            </label>
            <label style={labelStyle}>
              Skills{" "}
              <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.85rem" }}>
                (comma-separated)
              </span>
              <input
                style={inputStyle}
                value={form.skillsRaw}
                onChange={(e) => set("skillsRaw", e.target.value)}
                placeholder="e.g. React, TypeScript, Node.js, SQL"
              />
              {parsedSkills().length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {parsedSkills().map((s) => (
                    <span key={s} className="tag-pill">{s}</span>
                  ))}
                </div>
              )}
            </label>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button className="secondary-btn" onClick={() => setStep(1)}>← Back</button>
              <button className="primary-btn" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 3 – Summary */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Write your professional summary, or let AI write one for you based on your skills and experience.
            </p>

            {/* AI Generate button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--primary)",
                background: "rgba(var(--primary-rgb, 99,102,241), 0.05)",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>
                  ✨ Generate with AI
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "2px 0 0" }}>
                  Uses your name, experience, education and skills to write a professional summary.
                </p>
              </div>
              <button
                className="primary-btn"
                onClick={handleGenerate}
                disabled={aiGenerating}
                style={{ whiteSpace: "nowrap", minWidth: "130px" }}
              >
                {aiGenerating ? "Generating…" : "Generate"}
              </button>
            </div>

            {aiError && (
              <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{aiError}</p>
            )}

            <label style={labelStyle}>
              Professional Summary
              <textarea
                style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                placeholder="e.g. Results-driven software engineer with 4 years of experience building scalable web applications…"
              />
              <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                {form.summary.length} characters
              </span>
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button className="secondary-btn" onClick={() => setStep(2)}>← Back</button>
              <button className="primary-btn" onClick={() => setStep(4)}>Preview CV →</button>
            </div>
          </div>
        )}

        {/* Step 4 – Preview & Save */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Review your CV below. Once saved, recruiters will see this when you apply for jobs.
            </p>

            {/* CV Preview card */}
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
              {/* Header */}
              <div style={{ borderBottom: "2px solid var(--primary)", paddingBottom: "16px" }}>
                <h2 style={{ fontSize: "1.6rem", margin: 0 }}>{form.fullName || "—"}</h2>
                <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                  {form.email}{form.phone ? ` · ${form.phone}` : ""}
                </p>
              </div>

              {/* Summary */}
              {form.summary && (
                <div>
                  <h4 style={sectionTitle}>Professional Summary</h4>
                  <p style={{ lineHeight: 1.7 }}>{form.summary}</p>
                </div>
              )}

              {/* Experience & Education */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <h4 style={sectionTitle}>Experience</h4>
                  <p>{form.yearsOfExperience} year{form.yearsOfExperience !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <h4 style={sectionTitle}>Education</h4>
                  <p>{form.education || "—"}</p>
                </div>
              </div>

              {/* Skills */}
              {parsedSkills().length > 0 && (
                <div>
                  <h4 style={sectionTitle}>Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {parsedSkills().map((s) => (
                      <span key={s} className="tag-pill">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {saved && (
              <p style={{ color: "var(--success)", fontWeight: 600 }}>
                CV saved! Recruiters will see this when you apply.
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="secondary-btn" onClick={() => setStep(3)}>← Edit</button>
              <button
                className="primary-btn"
                onClick={handleSave}
                disabled={cvSaving}
              >
                {cvSaving ? "Saving…" : saved ? "Save Again" : "Save CV"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontWeight: 600,
  fontSize: "0.9rem",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

const sectionTitle: React.CSSProperties = {
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  color: "var(--muted)",
  marginBottom: "6px",
};

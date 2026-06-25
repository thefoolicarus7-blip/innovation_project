import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadMyCv, saveMyCvThunk } from "../store/slices/userSlice";
import { generateCVSummary } from "../services/api";
import type { WorkExperience } from "../types";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Personal Info", "Experience & Skills", "Summary", "Preview"];
const GENDER_OPTIONS = ["Prefer not to say", "Male", "Female", "Non-binary", "Other"];

function emptyExperience(): WorkExperience {
  return { jobTitle: "", company: "", startDate: "", endDate: "", description: "" };
}

type FormErrors = Record<string, string>;
type ExpErrors = Record<string, string>[];

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [expErrors, setExpErrors] = useState<ExpErrors>([{}]);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    yearsOfExperience: 0,
    education: "",
    skillsRaw: "",
    summary: "",
  });

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([emptyExperience()]);

  useEffect(() => { void dispatch(loadMyCv()); }, [dispatch]);

  useEffect(() => {
    if (cv) {
      setForm({
        fullName: cv.fullName ?? "",
        email: cv.email ?? "",
        phone: cv.phone ?? "",
        dateOfBirth: cv.dateOfBirth ?? "",
        gender: cv.gender ?? "",
        address: cv.address ?? "",
        yearsOfExperience: cv.yearsOfExperience ?? 0,
        education: cv.education ?? "",
        skillsRaw: (cv.skills ?? []).join(", "),
        summary: cv.summary ?? "",
      });
      if (Array.isArray(cv.workExperiences) && cv.workExperiences.length > 0) {
        setWorkExperiences(cv.workExperiences.map((e: WorkExperience) => ({ ...e, endDate: e.endDate ?? "" })));
        setExpErrors(cv.workExperiences.map(() => ({})));
      }
    }
  }, [cv]);

  function set(key: keyof typeof form, value: string | number) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function parsedSkills(): string[] {
    return form.skillsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  function updateExperience(index: number, key: keyof WorkExperience, value: string) {
    setSaved(false);
    setWorkExperiences((prev) => prev.map((e, i) => (i === index ? { ...e, [key]: value } : e)));
    setExpErrors((prev) => prev.map((e, i) => {
      if (i !== index) return e;
      const next = { ...e };
      delete next[key];
      return next;
    }));
  }

  function addExperience() {
    setWorkExperiences((prev) => [...prev, emptyExperience()]);
    setExpErrors((prev) => [...prev, {}]);
  }

  function removeExperience(index: number) {
    setWorkExperiences((prev) => prev.filter((_, i) => i !== index));
    setExpErrors((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Validation ──────────────────────────────────────────────

  function validateStep1(): FormErrors {
    const e: FormErrors = {};
    if (!form.fullName.trim())   e.fullName   = "Full name is required.";
    if (!form.email.trim())      e.email      = "Professional email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim())      e.phone      = "Phone number is required.";
    if (!form.dateOfBirth)       e.dateOfBirth = "Date of birth is required.";
    if (!form.gender)            e.gender     = "Please select a gender.";
    if (!form.address.trim())    e.address    = "Current address is required.";
    return e;
  }

  function validateStep2(): { formErrs: FormErrors; expErrs: ExpErrors } {
    const formErrs: FormErrors = {};
    const expErrs: ExpErrors = workExperiences.map((exp) => {
      const e: FormErrors = {};
      if (!exp.jobTitle.trim())  e.jobTitle  = "Job title is required.";
      if (!exp.company.trim())   e.company   = "Company is required.";
      if (!exp.startDate)        e.startDate = "Start date is required.";
      return e;
    });

    if (Number(form.yearsOfExperience) < 0)
      formErrs.yearsOfExperience = "Years of experience cannot be negative.";
    if (!form.education.trim())
      formErrs.education = "Education is required.";
    if (parsedSkills().length === 0)
      formErrs.skillsRaw = "Please enter at least one skill.";

    return { formErrs, expErrs };
  }

  function validateStep3(): FormErrors {
    const e: FormErrors = {};
    if (!form.summary.trim()) e.summary = "Professional summary is required. Use the AI generator or write your own.";
    return e;
  }

  function tryAdvance(to: Step) {
    if (to <= step) { setStep(to); return; }

    if (step === 1) {
      const e = validateStep1();
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setErrors({});
      setStep(to);
    } else if (step === 2) {
      const { formErrs, expErrs } = validateStep2();
      const hasExpErr = expErrs.some((e) => Object.keys(e).length > 0);
      if (Object.keys(formErrs).length > 0 || hasExpErr) {
        setErrors(formErrs);
        setExpErrors(expErrs);
        return;
      }
      setErrors({});
      setExpErrors(workExperiences.map(() => ({})));
      setStep(to);
    } else if (step === 3) {
      const e = validateStep3();
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setErrors({});
      setStep(to);
    }
  }

  // ── AI Generate ──────────────────────────────────────────────

  async function handleGenerate() {
    const skills = parsedSkills();
    setAiError(null);
    setAiGenerating(true);
    try {
      const summary = await generateCVSummary({
        fullName: form.fullName,
        yearsOfExperience: Number(form.yearsOfExperience),
        education: form.education,
        skills,
        workExperiences,
      });
      set("summary", summary);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setAiGenerating(false);
    }
  }

  // ── Save ─────────────────────────────────────────────────────

  async function handleSave() {
    const step1Errors = validateStep1();
    const { formErrs, expErrs } = validateStep2();
    const step3Errors = validateStep3();
    if (
      Object.keys(step1Errors).length > 0 ||
      Object.keys(formErrs).length > 0 ||
      expErrs.some((e) => Object.keys(e).length > 0) ||
      Object.keys(step3Errors).length > 0
    ) {
      setErrors({ ...step1Errors, ...formErrs, ...step3Errors });
      setExpErrors(expErrs);
      setStep(Object.keys(step1Errors).length > 0 ? 1 : Object.keys(formErrs).length > 0 || expErrs.some((e) => Object.keys(e).length > 0) ? 2 : 3);
      return;
    }

    const validExperiences = workExperiences.filter((e) => e.jobTitle && e.company && e.startDate);
    const result = await dispatch(
      saveMyCvThunk({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        yearsOfExperience: Number(form.yearsOfExperience),
        workExperiences: validExperiences,
        education: form.education,
        skills: parsedSkills(),
        summary: form.summary,
      }),
    );
    if (saveMyCvThunk.fulfilled.match(result)) setSaved(true);
  }

  if (cvLoading) {
    return <div className="page-stack"><div className="panel"><p>Loading your CV…</p></div></div>;
  }

  const hasErrors = Object.keys(errors).length > 0 || expErrors.some((e) => Object.keys(e).length > 0);

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
                onClick={() => tryAdvance(n)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  borderRadius: "var(--radius-sm)",
                  border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: active ? "var(--primary)" : done ? "var(--muted-bg)" : "transparent",
                  color: active ? "var(--primary-foreground)" : done ? "var(--foreground)" : "var(--muted)",
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

        {/* Global error banner */}
        {hasErrors && (
          <div style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--danger)",
            background: "rgba(239,68,68,0.08)",
            color: "var(--danger)",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}>
            Please fill in all required fields before continuing.
          </div>
        )}

        {/* ── Step 1 – Personal Info ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              All fields are required — this appears at the top of your CV.
            </p>

            <Field label="Full Name" error={errors.fullName}>
              <input
                style={inputStyle(!!errors.fullName)}
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </Field>

            <Field label="Professional Email" error={errors.email}>
              <input
                style={inputStyle(!!errors.email)}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="e.g. jane@example.com"
              />
            </Field>

            <Field label="Phone Number" error={errors.phone}>
              <input
                style={inputStyle(!!errors.phone)}
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. +27 82 123 4567"
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <Field label="Date of Birth" error={errors.dateOfBirth}>
                <input
                  style={inputStyle(!!errors.dateOfBirth)}
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </Field>
              <Field label="Gender" error={errors.gender}>
                <select
                  style={inputStyle(!!errors.gender)}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">Select…</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Current Address" error={errors.address}>
              <input
                style={inputStyle(!!errors.address)}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="e.g. 12 Main Street, Cape Town, 8001"
              />
            </Field>

            <div style={{ marginTop: "8px" }}>
              <button className="primary-btn" onClick={() => tryAdvance(2)}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 2 – Experience & Skills ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              All fields marked below are required. End date can be left blank for your current job.
            </p>

            {/* Work Experience */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Work Experience</span>
                <button
                  className="secondary-btn"
                  onClick={addExperience}
                  style={{ fontSize: "0.82rem", padding: "6px 14px" }}
                >
                  + Add Position
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {workExperiences.map((exp, i) => {
                  const ee = expErrors[i] ?? {};
                  return (
                    <div
                      key={i}
                      style={{
                        border: `1px solid ${Object.keys(ee).length > 0 ? "var(--danger)" : "var(--border)"}`,
                        borderRadius: "var(--radius-md)",
                        padding: "16px",
                        background: "var(--card-raised)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--muted)" }}>
                          Position {i + 1}
                        </span>
                        {workExperiences.length > 1 && (
                          <button
                            onClick={() => removeExperience(i)}
                            style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.82rem", padding: "2px 6px" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <Field label="Job Title" error={ee.jobTitle}>
                          <input
                            style={inputStyle(!!ee.jobTitle)}
                            value={exp.jobTitle}
                            onChange={(e) => updateExperience(i, "jobTitle", e.target.value)}
                            placeholder="e.g. Software Engineer"
                          />
                        </Field>
                        <Field label="Company" error={ee.company}>
                          <input
                            style={inputStyle(!!ee.company)}
                            value={exp.company}
                            onChange={(e) => updateExperience(i, "company", e.target.value)}
                            placeholder="e.g. Acme Corp"
                          />
                        </Field>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <Field label="Start Date" error={ee.startDate}>
                          <input
                            style={inputStyle(!!ee.startDate)}
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(i, "startDate", e.target.value)}
                          />
                        </Field>
                        <Field label="End Date" hint="Leave blank if this is your current job">
                          <input
                            style={inputStyle(false)}
                            type="month"
                            value={exp.endDate ?? ""}
                            onChange={(e) => updateExperience(i, "endDate", e.target.value)}
                          />
                        </Field>
                      </div>

                      <Field label="Description" hint="Optional — briefly describe your role and achievements">
                        <textarea
                          style={{ ...inputStyle(false), minHeight: "70px", resize: "vertical" }}
                          value={exp.description ?? ""}
                          onChange={(e) => updateExperience(i, "description", e.target.value)}
                          placeholder="e.g. Led a team of 4 engineers to deliver a real-time payments platform…"
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            </div>

            <Field label="Total Years of Experience" error={errors.yearsOfExperience}>
              <input
                style={inputStyle(!!errors.yearsOfExperience)}
                type="number"
                min={0}
                value={form.yearsOfExperience}
                onChange={(e) => set("yearsOfExperience", e.target.value)}
              />
            </Field>

            <Field label="Highest Education Level" error={errors.education}>
              <input
                style={inputStyle(!!errors.education)}
                value={form.education}
                onChange={(e) => set("education", e.target.value)}
                placeholder="e.g. BSc Computer Science, University of Cape Town"
              />
            </Field>

            <Field
              label={<>Skills <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.85rem" }}>(comma-separated)</span></>}
              error={errors.skillsRaw}
            >
              <input
                style={inputStyle(!!errors.skillsRaw)}
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
            </Field>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button className="secondary-btn" onClick={() => setStep(1)}>← Back</button>
              <button className="primary-btn" onClick={() => tryAdvance(3)}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 3 – Summary ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              A professional summary is required. Use the AI generator or write your own.
            </p>

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
                <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>✨ Generate with AI</p>
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

            {aiError && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{aiError}</p>}

            <Field label="Professional Summary" error={errors.summary}>
              <textarea
                style={{ ...inputStyle(!!errors.summary), minHeight: "140px", resize: "vertical" }}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                placeholder="e.g. Results-driven software engineer with 4 years of experience building scalable web applications…"
              />
              <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{form.summary.length} characters</span>
            </Field>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button className="secondary-btn" onClick={() => setStep(2)}>← Back</button>
              <button className="primary-btn" onClick={() => tryAdvance(4)}>Preview CV →</button>
            </div>
          </div>
        )}

        {/* ── Step 4 – Preview & Save ── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Review your CV below. Once saved, recruiters will see this when you apply for jobs.
            </p>

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
                <h2 style={{ fontSize: "1.6rem", margin: 0 }}>{form.fullName}</h2>
                <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "0.9rem" }}>
                  {[form.email, form.phone].filter(Boolean).join(" · ")}
                </p>
                <p style={{ color: "var(--muted)", margin: "2px 0 0", fontSize: "0.85rem" }}>
                  {[
                    form.dateOfBirth && `DOB: ${form.dateOfBirth}`,
                    form.gender && form.gender !== "Prefer not to say" && form.gender,
                    form.address,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>

              {form.summary && (
                <div>
                  <h4 style={sectionTitle}>Professional Summary</h4>
                  <p style={{ lineHeight: 1.7 }}>{form.summary}</p>
                </div>
              )}

              {workExperiences.filter((e) => e.jobTitle && e.company).length > 0 && (
                <div>
                  <h4 style={sectionTitle}>Work Experience</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {workExperiences.filter((e) => e.jobTitle && e.company).map((exp, i) => (
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
                  <p>{form.yearsOfExperience} year{form.yearsOfExperience !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <h4 style={sectionTitle}>Education</h4>
                  <p>{form.education}</p>
                </div>
              </div>

              {parsedSkills().length > 0 && (
                <div>
                  <h4 style={sectionTitle}>Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {parsedSkills().map((s) => <span key={s} className="tag-pill">{s}</span>)}
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
              <button className="primary-btn" onClick={handleSave} disabled={cvSaving}>
                {cvSaving ? "Saving…" : saved ? "Save Again" : "Save CV"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper component ──────────────────────────────────────────

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: React.ReactNode;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={labelStyle}>
      {label}
      {children}
      {error && (
        <span style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: 500 }}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 400 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

// ── Styles ────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontWeight: 600,
  fontSize: "0.9rem",
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
    background: "var(--card)",
    color: "var(--foreground)",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    outline: hasError ? "1px solid var(--danger)" : undefined,
  };
}

const sectionTitle: React.CSSProperties = {
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  color: "var(--muted)",
  marginBottom: "6px",
};

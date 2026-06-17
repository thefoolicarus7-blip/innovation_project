/**
 * UserProfileModal — Job Seeker profile slide-in drawer.
 *
 * Tabs:
 *   Personal  — editable (Full Name, Email, Phone, Address, DOB, Photo)
 *   Documents — real uploads via POST /api/media/upload → Cloudinary; URLs
 *               persisted in localStorage under s2w_user_docs_<userId>
 *   Security  — links + placeholders
 *   More      — navigation shortcuts + logout
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import { getMyCV, saveCV, uploadDocumentFile } from "../services/api";
import type { CvData, UploadedFile } from "../services/api";

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = "personal" | "documents" | "security" | "more";

const TABS: { id: Tab; label: string }[] = [
  { id: "personal",  label: "Personal"  },
  { id: "documents", label: "Documents" },
  { id: "security",  label: "Security"  },
  { id: "more",      label: "More"      },
];

// ─── Persisted personal extras (address, DOB, photo) ─────────────────────────
type ProfileExtra = { address: string; dateOfBirth: string; photo: string };

function extraKey(uid: string)    { return `s2w_profile_extra_${uid}`; }
function loadExtra(uid: string): ProfileExtra {
  try {
    const raw = localStorage.getItem(extraKey(uid));
    return raw ? (JSON.parse(raw) as ProfileExtra) : { address: "", dateOfBirth: "", photo: "" };
  } catch { return { address: "", dateOfBirth: "", photo: "" }; }
}

type PersonalForm = {
  fullName: string; email: string; phone: string;
  address: string; dateOfBirth: string; photo: string;
};

// ─── Persisted document store ─────────────────────────────────────────────────
// Each slot holds the last successfully uploaded file for that category.
type StoredDoc = UploadedFile & { uploadedAt: string };

type UserDocs = {
  certificates?: StoredDoc;
  education?:    StoredDoc;
  identity?:     StoredDoc;
};

function docsKey(uid: string) { return `s2w_user_docs_${uid}`; }
function loadDocs(uid: string): UserDocs {
  try {
    const raw = localStorage.getItem(docsKey(uid));
    return raw ? (JSON.parse(raw) as UserDocs) : {};
  } catch { return {}; }
}

// Config for the three uploadable document slots
const DOC_SLOTS = [
  {
    key:    "certificates" as const,
    label:  "Certificates & Licenses",
    folder: "swipe2work/certificates",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    hint:   "PDF or image, max 10 MB",
  },
  {
    key:    "education" as const,
    label:  "Educational Documents",
    folder: "swipe2work/education",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    hint:   "PDF or image, max 10 MB",
  },
  {
    key:    "identity" as const,
    label:  "Citizenship / Passport / National ID",
    folder: "swipe2work/identity",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    hint:   "PDF or image, max 10 MB",
  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────
interface UserProfileModalProps {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user     = useAppSelector((state: any) => state.auth.user);

  const [activeTab, setActiveTab] = useState<Tab>("personal");

  // ── Personal tab state ────────────────────────────────────────────────────
  const [cvData,     setCvData]     = useState<CvData | null>(null);
  const [form,       setForm]       = useState<PersonalForm>({
    fullName: user?.name ?? "", email: user?.email ?? "",
    phone: "", address: "", dateOfBirth: "", photo: "",
  });
  const [editMode,   setEditMode]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [loadingPf,  setLoadingPf]  = useState(true);
  const [saveMsg,    setSaveMsg]    = useState<{ type: "success" | "error"; text: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── Documents tab state ───────────────────────────────────────────────────
  const [docs,         setDocs]         = useState<UserDocs>({});
  // Per-slot uploading flag
  const [uploading,    setUploading]    = useState<Partial<Record<keyof UserDocs, boolean>>>({});
  // Per-slot error message
  const [docErrors,    setDocErrors]    = useState<Partial<Record<keyof UserDocs, string>>>({});
  // One hidden file input per slot
  const certRef = useRef<HTMLInputElement>(null);
  const educRef = useRef<HTMLInputElement>(null);
  const idRef   = useRef<HTMLInputElement>(null);
  const docRefs: Record<keyof UserDocs, React.RefObject<HTMLInputElement | null>> = {
    certificates: certRef,
    education:    educRef,
    identity:     idRef,
  };

  // ── Load profile + docs on open ───────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setLoadingPf(false); return; }

    // Personal extras from localStorage
    const extra = loadExtra(user.id);
    setForm({
      fullName:    user.name  ?? "",
      email:       user.email ?? "",
      phone: "", address: extra.address, dateOfBirth: extra.dateOfBirth, photo: extra.photo,
    });

    // Fetch CV for phone / fullName
    getMyCV()
      .then((cv) => {
        if (cv) {
          setCvData(cv);
          setForm((prev) => ({
            ...prev,
            fullName: cv.fullName || prev.fullName,
            phone:    cv.phone    || prev.phone,
          }));
        }
      })
      .catch(() => { /* CV may not exist yet */ })
      .finally(() => setLoadingPf(false));

    // Uploaded documents from localStorage
    setDocs(loadDocs(user.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Derived values ────────────────────────────────────────────────────────
  const filledFields = [form.fullName, form.email, form.phone, form.address, form.dateOfBirth, form.photo].filter(Boolean).length;
  const completionPct = Math.min(100, Math.round((filledFields / 6) * 80) + (user?.isVerified === "true" ? 20 : 0));
  const initial = form.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "U";

  const goTo = (path: string) => { onClose(); navigate(path); };
  const handleLogout = () => { dispatch(logoutUser()); onClose(); navigate("/"); };

  // ── Personal: photo selection ─────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveMsg({ type: "error", text: "Please select an image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSaveMsg({ type: "error", text: "Photo must be under 2 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: (ev.target?.result as string) ?? "" }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Personal: save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      setSaveMsg({ type: "error", text: "Full Name and Email are required." });
      return;
    }
    setSaving(true); setSaveMsg(null);
    try {
      if (user?.id) {
        localStorage.setItem(extraKey(user.id), JSON.stringify({
          address: form.address, dateOfBirth: form.dateOfBirth, photo: form.photo,
        }));
      }
      const payload = {
        fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(),
        yearsOfExperience: cvData?.yearsOfExperience ?? 0,
        skills: cvData?.skills ?? [], education: cvData?.education ?? "", summary: cvData?.summary ?? "",
      };
      const updated = await saveCV(payload);
      setCvData(updated);
      setSaveMsg({ type: "success", text: "Profile updated successfully." });
      setEditMode(false);
    } catch {
      setSaveMsg({ type: "error", text: "Could not save. Please try again." });
    } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    if (user?.id) {
      const extra = loadExtra(user.id);
      setForm({
        fullName: cvData?.fullName ?? user?.name ?? "", email: user?.email ?? "",
        phone: cvData?.phone ?? "", address: extra.address,
        dateOfBirth: extra.dateOfBirth, photo: extra.photo,
      });
    }
    setSaveMsg(null); setEditMode(false);
  };

  // ── Documents: upload handler ─────────────────────────────────────────────
  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: typeof DOC_SLOTS[number],
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    e.target.value = ""; // allow re-selecting same file

    setUploading((u) => ({ ...u, [slot.key]: true }));
    setDocErrors((er) => ({ ...er, [slot.key]: "" }));

    try {
      const result = await uploadDocumentFile(file, slot.folder);
      const doc: StoredDoc = { ...result, uploadedAt: new Date().toISOString() };
      const updated: UserDocs = { ...docs, [slot.key]: doc };
      setDocs(updated);
      localStorage.setItem(docsKey(user.id), JSON.stringify(updated));
    } catch (err) {
      setDocErrors((er) => ({
        ...er,
        [slot.key]: err instanceof Error ? err.message : "Upload failed.",
      }));
    } finally {
      setUploading((u) => ({ ...u, [slot.key]: false }));
    }
  };

  // Formats bytes → "1.2 MB" / "340 KB"
  const fmtBytes = (b: number) =>
    b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`;

  const labelStyle: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 500, color: "var(--muted)" };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="profile-panel-overlay" onClick={onClose} aria-hidden="true" />

      <div className="profile-panel" role="dialog" aria-modal="true" aria-label="Job Seeker Profile">

        {/* Header */}
        <div className="profile-panel-header">
          <div>
            <h2>My Profile</h2>
            <p>{user?.email}</p>
          </div>
          <button className="profile-panel-close" onClick={onClose} aria-label="Close profile panel">✕</button>
        </div>

        {/* Tabs */}
        <div className="profile-panel-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id} role="tab" aria-selected={activeTab === t.id}
              className={`profile-tab-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => { setActiveTab(t.id); setSaveMsg(null); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="profile-panel-body">

          {/* ══════════════════════════════════════════
              TAB: Personal (editable)
              ══════════════════════════════════════════ */}
          {activeTab === "personal" && (
            <div className="profile-section">

              {/* Avatar row */}
              <div className="profile-avatar-row">
                <div
                  className="profile-avatar"
                  style={form.photo ? { backgroundImage: `url(${form.photo})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  {!form.photo && initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 2 }}>{form.fullName || user?.name || "—"}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 8 }}>Job Seeker</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted-foreground)", marginBottom: 4 }}>
                    <span>Profile completion</span><span>{completionPct}%</span>
                  </div>
                  <div className="profile-completion-track">
                    <div className="profile-completion-fill" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {saveMsg && (
                <div style={{
                  padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "0.85rem",
                  background: saveMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${saveMsg.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: saveMsg.type === "success" ? "var(--success)" : "var(--danger)",
                }}>
                  {saveMsg.text}
                </div>
              )}

              {/* Section header with Edit / Save / Cancel */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p className="profile-section-label" style={{ margin: 0 }}>Personal Information</p>
                {!editMode ? (
                  <button className="secondary-btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => { setSaveMsg(null); setEditMode(true); }} disabled={loadingPf}>
                    Edit
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      onClick={handleCancelEdit} disabled={saving}>Cancel</button>
                    <button className="primary-btn" style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                      onClick={handleSave} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {loadingPf ? (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Loading profile…</p>
              ) : editMode ? (
                /* Edit mode */
                <div className="form-grid">
                  {/* Photo */}
                  <div className="field-wrap">
                    <label style={labelStyle}>Profile Photo</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="profile-avatar" style={{
                        width: 48, height: 48, fontSize: "1.1rem", flexShrink: 0,
                        ...(form.photo ? { backgroundImage: `url(${form.photo})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
                      }}>
                        {!form.photo && initial}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                        <button type="button" className="secondary-btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                          onClick={() => photoInputRef.current?.click()}>Change Photo</button>
                        {form.photo && (
                          <button type="button" className="secondary-btn"
                            style={{ padding: "4px 10px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
                            onClick={() => setForm((f) => ({ ...f, photo: "" }))}>Remove</button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: 4 }}>JPG, PNG or GIF · Max 2 MB</p>
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="pf-fullname" style={labelStyle}>Full Name</label>
                    <input id="pf-fullname" type="text" value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder="Enter your full name" required />
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="pf-email" style={labelStyle}>Email Address</label>
                    <input id="pf-email" type="email" value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Enter your email" required />
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="pf-phone" style={labelStyle}>Phone Number</label>
                    <input id="pf-phone" type="tel" value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000" />
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="pf-address" style={labelStyle}>Address</label>
                    <input id="pf-address" type="text" value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="City, Country" />
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="pf-dob" style={labelStyle}>Date of Birth</label>
                    <input id="pf-dob" type="date" value={form.dateOfBirth}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
                  </div>
                </div>
              ) : (
                /* View mode */
                <div style={{ display: "grid", gap: 8 }}>
                  {form.photo && (
                    <div className="profile-info-row" style={{ gap: 12 }}>
                      <span>Photo</span>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        backgroundImage: `url(${form.photo})`, backgroundSize: "cover",
                        backgroundPosition: "center", border: "1px solid var(--border)" }} />
                    </div>
                  )}
                  {[
                    ["Full Name",    form.fullName],
                    ["Email Address", form.email],
                    ["Phone Number", form.phone],
                    ["Address",      form.address],
                    ["Date of Birth", form.dateOfBirth],
                  ].map(([label, value]) => (
                    <div key={label} className="profile-info-row">
                      <span>{label}</span>
                      <span style={{ fontWeight: 500, wordBreak: "break-all" }}>{value || "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="profile-section-label">Skills &amp; Experience</p>
              <div className="profile-action-list">
                <button className="profile-action-item" onClick={() => goTo("/user/cv-builder")}>
                  <span>Edit Skills &amp; Experience</span><span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-item" onClick={() => goTo("/user/cv-builder")}>
                  <span>Build / Update My CV</span><span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-item" onClick={() => goTo("/user/interview-prep")}>
                  <span>AI Interview Preparation</span><span className="profile-action-arrow">›</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB: Documents & Verification
              ══════════════════════════════════════════ */}
          {activeTab === "documents" && (
            <div className="profile-section">

              {/* Verification status */}
              <p className="profile-section-label">B. Verification Status</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div className="profile-info-row">
                  <span>Email Verification</span>
                  <span className={`profile-status-badge ${user?.isVerified === "true" ? "verified" : "pending"}`}>
                    {user?.isVerified === "true" ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="profile-info-row">
                  <span>Phone Verification</span>
                  <span className="profile-status-badge pending">Not Added</span>
                </div>
                <div className="profile-info-row">
                  <span>Identity Verification</span>
                  <span className="profile-status-badge pending">Not Submitted</span>
                </div>
                <div className="profile-info-row">
                  <span>Profile Completion</span>
                  <span style={{ fontWeight: 600 }}>{completionPct}%</span>
                </div>
              </div>

              {/* Resume — links to CV Builder (unchanged) */}
              <p className="profile-section-label">Document Uploads</p>
              <div className="profile-doc-row">
                <span style={{ fontWeight: 500 }}>Resume / CV</span>
                <div className="profile-doc-actions">
                  <span className="profile-status-badge pending">Not Generated</span>
                  <button className="secondary-btn"
                    style={{ padding: "6px 14px", fontSize: "0.8rem", marginLeft: "auto" }}
                    onClick={() => goTo("/user/cv-builder")}>
                    Go to CV Builder
                  </button>
                </div>
              </div>

              {/* Hidden file inputs — one per upload slot */}
              {DOC_SLOTS.map((slot) => (
                <input
                  key={slot.key}
                  ref={docRefs[slot.key] as React.RefObject<HTMLInputElement>}
                  type="file"
                  accept={slot.accept}
                  style={{ display: "none" }}
                  onChange={(e) => handleDocUpload(e, slot)}
                />
              ))}

              {/* Uploadable document slots */}
              {DOC_SLOTS.map((slot) => {
                const stored   = docs[slot.key];
                const isUp     = uploading[slot.key] ?? false;
                const errMsg   = docErrors[slot.key] ?? "";
                const isPdf    = stored?.mimeType === "application/pdf";

                return (
                  <div key={slot.key} className="profile-doc-row">
                    <span style={{ fontWeight: 500 }}>{slot.label}</span>

                    {/* Status + action row */}
                    <div className="profile-doc-actions">
                      {/* Status badge */}
                      <span className={`profile-status-badge ${stored ? "verified" : "pending"}`}>
                        {isUp ? "Uploading…" : stored ? "Uploaded" : "Not Uploaded"}
                      </span>

                      {/* View link (only when uploaded) */}
                      {stored && !isUp && (
                        <a
                          href={stored.secureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="secondary-btn"
                          style={{ padding: "6px 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center" }}
                        >
                          {isPdf ? "View PDF" : "View"}
                        </a>
                      )}

                      {/* Upload / Replace button */}
                      <button
                        className="secondary-btn"
                        style={{ padding: "6px 14px", fontSize: "0.8rem", marginLeft: "auto" }}
                        disabled={isUp}
                        onClick={() => docRefs[slot.key].current?.click()}
                      >
                        {isUp ? "Uploading…" : stored ? "Replace" : "Upload"}
                      </button>
                    </div>

                    {/* Uploaded file details */}
                    {stored && !isUp && (
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>{stored.originalName}</span>
                        <span>·</span>
                        <span>{fmtBytes(stored.bytes)}</span>
                        <span>·</span>
                        <span>Uploaded {new Date(stored.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Per-slot error */}
                    {errMsg && (
                      <p style={{ fontSize: "0.78rem", color: "var(--danger)", margin: 0 }}>{errMsg}</p>
                    )}

                    {/* Accepted formats hint */}
                    {!stored && !isUp && (
                      <p style={{ fontSize: "0.73rem", color: "var(--muted-foreground)", margin: 0 }}>{slot.hint}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: Privacy & Security
              ══════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="profile-section">
              <p className="profile-section-label">C. Account Security</p>
              <div className="profile-action-list">
                <button className="profile-action-item" onClick={() => goTo("/user/change-password")}>
                  <span>Change Password</span><span className="profile-action-arrow">›</span>
                </button>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Two-Factor Authentication (2FA)</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Login Activity</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Login Activity &amp; History</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Device History</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Privacy</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Account Privacy Settings</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Notification Preferences</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Data Download</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <div className="profile-divider" />

              <p className="profile-section-label">Danger Zone</p>
              <div className="profile-action-list">
                <button className="profile-action-item danger"
                  onClick={() => alert("Account deactivation is not yet available. Please contact support.")}>
                  <span>Deactivate Account</span><span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-item danger"
                  onClick={() => alert("Account deletion is not yet available. Please contact support.")}>
                  <span>Delete Account</span><span className="profile-action-arrow">›</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: More / Other Features
              ══════════════════════════════════ */}
          {activeTab === "more" && (
            <div className="profile-section">
              <p className="profile-section-label">D. Jobs &amp; Applications</p>
              <div className="profile-action-list">
                <button className="profile-action-item" onClick={() => goTo("/user/dashboard")}>
                  <span>Browse Jobs</span><span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-item" onClick={() => goTo("/user/applications")}>
                  <span>Applied Jobs History</span><span className="profile-action-arrow">›</span>
                </button>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Saved Jobs</span><span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Bookmarked Employers</span><span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Job Alerts &amp; Preferences</span><span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Profile Settings</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Profile Visibility Settings</span><span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Language Preferences</span><span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Help &amp; Legal</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Support &amp; Help Center</span><span className="profile-action-arrow">›</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Terms and Conditions</span><span className="profile-action-arrow">›</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Privacy Policy</span><span className="profile-action-arrow">›</span>
                </div>
              </div>

              <div className="profile-divider" />

              <button
                className="secondary-btn"
                style={{ width: "100%", justifyContent: "center", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}

        </div>{/* end .profile-panel-body */}
      </div>{/* end .profile-panel */}
    </>
  );
}

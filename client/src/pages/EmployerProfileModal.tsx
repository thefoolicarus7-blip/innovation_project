/**
 * EmployerProfileModal — Company / Employer profile slide-in drawer.
 *
 * Changes in this version:
 *  - Company tab: fully editable (all fields + contact phone via localStorage)
 *  - Documents tab: real uploads via POST /api/media/upload → Cloudinary
 *  - Security tab: Coming Soon items removed; only Change Password remains
 *  - More tab: Subscription & Billing and Help & Legal section removed
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import { updateCompanyProfile } from "../store/slices/portalSlice";
import { uploadDocumentFile } from "../services/api";
import type { UploadedFile } from "../services/api";
import type { CompanyProfile } from "../types";

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = "company" | "documents" | "security" | "more";

const TABS: { id: Tab; label: string }[] = [
  { id: "company",   label: "Company"   },
  { id: "documents", label: "Documents" },
  { id: "security",  label: "Security"  },
  { id: "more",      label: "More"      },
];

// ─── Company form (mirrors CompanyProfile + extras not in the schema) ─────────
type CompanyForm = {
  companyName: string; companyType: string; industry: string;
  teamSize: string; address: string; city: string; country: string;
  website: string; contactPhone: string;
};

// Extra fields stored per-user in localStorage (contactPhone is not in schema)
function companyExtraKey(uid: string) { return `s2w_company_extra_${uid}`; }
function loadCompanyExtra(uid: string): { contactPhone: string } {
  try {
    const raw = localStorage.getItem(companyExtraKey(uid));
    return raw ? JSON.parse(raw) : { contactPhone: "" };
  } catch { return { contactPhone: "" }; }
}

// ─── Document upload helpers (same pattern as UserProfileModal) ───────────────
type StoredDoc = UploadedFile & { uploadedAt: string };
type CompanyDocs = { businessReg?: StoredDoc; taxId?: StoredDoc };

function companyDocsKey(uid: string) { return `s2w_company_docs_${uid}`; }
function loadCompanyDocs(uid: string): CompanyDocs {
  try {
    const raw = localStorage.getItem(companyDocsKey(uid));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

const DOC_SLOTS = [
  {
    key:    "businessReg" as const,
    label:  "Business Registration Document",
    folder: "swipe2work/business-registration",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    hint:   "PDF or image, max 10 MB",
  },
  {
    key:    "taxId" as const,
    label:  "Tax Identification Document",
    folder: "swipe2work/tax-identification",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    hint:   "PDF or image, max 10 MB",
  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────
interface EmployerProfileModalProps {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployerProfileModal({ onClose }: EmployerProfileModalProps) {
  const dispatch       = useAppDispatch();
  const navigate       = useNavigate();
  const user           = useAppSelector((state: any) => state.auth.user);
  const companyProfile = useAppSelector((state: any) => state.portal.companyProfile) as CompanyProfile | null;

  const [activeTab, setActiveTab] = useState<Tab>("company");

  // ── Company tab state ─────────────────────────────────────────────────────
  const [form, setForm] = useState<CompanyForm>({
    companyName: "", companyType: "", industry: "",
    teamSize: "", address: "", city: "", country: "",
    website: "", contactPhone: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Seed form from Redux state + localStorage whenever the panel opens
  useEffect(() => {
    const extra = user?.id ? loadCompanyExtra(user.id) : { contactPhone: "" };
    setForm({
      companyName:  companyProfile?.companyName  ?? "",
      companyType:  companyProfile?.companyType  ?? "",
      industry:     companyProfile?.industry     ?? "",
      teamSize:     companyProfile?.teamSize     ?? "",
      address:      companyProfile?.address      ?? "",
      city:         companyProfile?.city         ?? "",
      country:      companyProfile?.country      ?? "",
      website:      companyProfile?.website      ?? "",
      contactPhone: extra.contactPhone,
    });
  }, [companyProfile, user?.id]);

  // ── Documents tab state ───────────────────────────────────────────────────
  const [docs,      setDocs]      = useState<CompanyDocs>({});
  const [uploading, setUploading] = useState<Partial<Record<keyof CompanyDocs, boolean>>>({});
  const [docErrors, setDocErrors] = useState<Partial<Record<keyof CompanyDocs, string>>>({});
  const bizRef = useRef<HTMLInputElement>(null);
  const taxRef = useRef<HTMLInputElement>(null);
  const docRefs: Record<keyof CompanyDocs, React.RefObject<HTMLInputElement | null>> = {
    businessReg: bizRef,
    taxId:       taxRef,
  };

  // Load stored docs once on open
  useEffect(() => {
    if (user?.id) setDocs(loadCompanyDocs(user.id));
  }, [user?.id]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const initial = (form.companyName || companyProfile?.companyName || user?.name || "C").charAt(0).toUpperCase();
  const goTo    = (path: string) => { onClose(); navigate(path); };
  const handleLogout = () => { dispatch(logoutUser()); onClose(); navigate("/"); };

  const labelStyle: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 500, color: "var(--muted)" };
  const fmtBytes = (b: number) =>
    b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`;

  // ── Company: save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.companyName.trim()) {
      setSaveMsg({ type: "error", text: "Company Name is required." });
      return;
    }
    setSaving(true); setSaveMsg(null);
    try {
      // Persist contactPhone (not in CompanyProfile schema) to localStorage
      if (user?.id) {
        localStorage.setItem(companyExtraKey(user.id), JSON.stringify({ contactPhone: form.contactPhone }));
      }
      // Save all CompanyProfile fields via existing Redux thunk (hits /company/profile PUT)
      const payload: CompanyProfile = {
        companyName: form.companyName.trim(),
        companyType: form.companyType.trim(),
        industry:    form.industry.trim(),
        teamSize:    form.teamSize.trim(),
        address:     form.address.trim(),
        city:        form.city.trim(),
        country:     form.country.trim(),
        website:     form.website.trim(),
        about:       companyProfile?.about ?? "",
      };
      const result = await dispatch(updateCompanyProfile(payload));
      if (updateCompanyProfile.fulfilled.match(result)) {
        setSaveMsg({ type: "success", text: "Company profile updated." });
        setEditMode(false);
      } else {
        setSaveMsg({ type: "error", text: (result.payload as string) ?? "Could not save." });
      }
    } catch {
      setSaveMsg({ type: "error", text: "Could not save. Please try again." });
    } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    // Restore form from current Redux state
    const extra = user?.id ? loadCompanyExtra(user.id) : { contactPhone: "" };
    setForm({
      companyName:  companyProfile?.companyName  ?? "",
      companyType:  companyProfile?.companyType  ?? "",
      industry:     companyProfile?.industry     ?? "",
      teamSize:     companyProfile?.teamSize     ?? "",
      address:      companyProfile?.address      ?? "",
      city:         companyProfile?.city         ?? "",
      country:      companyProfile?.country      ?? "",
      website:      companyProfile?.website      ?? "",
      contactPhone: extra.contactPhone,
    });
    setSaveMsg(null); setEditMode(false);
  };

  // ── Documents: upload handler ─────────────────────────────────────────────
  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: typeof DOC_SLOTS[number],
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    e.target.value = "";

    setUploading((u) => ({ ...u, [slot.key]: true }));
    setDocErrors((er) => ({ ...er, [slot.key]: "" }));

    try {
      const result = await uploadDocumentFile(file, slot.folder);
      const doc: StoredDoc = { ...result, uploadedAt: new Date().toISOString() };
      const updated: CompanyDocs = { ...docs, [slot.key]: doc };
      setDocs(updated);
      localStorage.setItem(companyDocsKey(user.id), JSON.stringify(updated));
    } catch (err) {
      setDocErrors((er) => ({
        ...er,
        [slot.key]: err instanceof Error ? err.message : "Upload failed.",
      }));
    } finally {
      setUploading((u) => ({ ...u, [slot.key]: false }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="profile-panel-overlay" onClick={onClose} aria-hidden="true" />

      <div className="profile-panel" role="dialog" aria-modal="true" aria-label="Employer Profile">

        {/* Header */}
        <div className="profile-panel-header">
          <div>
            <h2>{form.companyName || companyProfile?.companyName || "My Company"}</h2>
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
              TAB: Company Information (editable)
              ══════════════════════════════════════════ */}
          {activeTab === "company" && (
            <div className="profile-section">

              {/* Avatar row */}
              <div className="profile-avatar-row">
                <div className="profile-avatar">{initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 2 }}>
                    {form.companyName || companyProfile?.companyName || "—"}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 2 }}>
                    {form.industry || companyProfile?.industry || "Company"}
                  </p>
                  {(form.website || companyProfile?.website) && (
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      {form.website || companyProfile?.website}
                    </p>
                  )}
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
                <p className="profile-section-label" style={{ margin: 0 }}>A. Company Information</p>
                {!editMode ? (
                  <button className="secondary-btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => { setSaveMsg(null); setEditMode(true); }}>
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

              {editMode ? (
                /* ── Edit mode: form inputs ── */
                <div className="form-grid">
                  {([
                    ["co-name",  "Company Name",  "companyName",  "text", "Acme Corp"],
                    ["co-type",  "Company Type",  "companyType",  "text", "Private Limited"],
                    ["co-ind",   "Industry",      "industry",     "text", "Technology"],
                    ["co-size",  "Team Size",     "teamSize",     "text", "1–10"],
                    ["co-addr",  "Address",       "address",      "text", "123 Main St"],
                    ["co-city",  "City",          "city",         "text", "Kathmandu"],
                    ["co-ctry",  "Country",       "country",      "text", "Nepal"],
                    ["co-web",   "Website",       "website",      "url",  "https://example.com"],
                  ] as [string, string, keyof CompanyForm, string, string][]).map(([id, label, field, type, ph]) => (
                    <div key={id} className="field-wrap">
                      <label htmlFor={id} style={labelStyle}>{label}</label>
                      <input
                        id={id} type={type}
                        value={form[field]}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        placeholder={ph}
                      />
                    </div>
                  ))}

                  {/* Contact info section */}
                  <p className="profile-section-label" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>
                    Contact Information
                  </p>

                  <div className="field-wrap">
                    <label style={labelStyle}>Contact Email</label>
                    {/* Email comes from the auth account — shown read-only */}
                    <input type="email" value={user?.email ?? ""} disabled
                      style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="co-phone" style={labelStyle}>Contact Phone</label>
                    <input id="co-phone" type="tel"
                      value={form.contactPhone}
                      onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                      placeholder="+977 98XXXXXXXX" />
                  </div>
                </div>
              ) : (
                /* ── View mode: info rows ── */
                <>
                  <div style={{ display: "grid", gap: 8 }}>
                    {([
                      ["Company Name", form.companyName],
                      ["Industry",     form.industry],
                      ["Company Type", form.companyType],
                      ["Team Size",    form.teamSize],
                      ["Address",      form.address],
                      ["City",         form.city],
                      ["Country",      form.country],
                      ["Website",      form.website],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} className="profile-info-row">
                        <span>{label}</span>
                        <span style={{ fontWeight: 500, wordBreak: "break-all" }}>{value || "—"}</span>
                      </div>
                    ))}
                  </div>

                  <p className="profile-section-label">Contact Information</p>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div className="profile-info-row">
                      <span>Contact Email</span>
                      <span style={{ fontWeight: 500 }}>{user?.email ?? "—"}</span>
                    </div>
                    <div className="profile-info-row">
                      <span>Contact Phone</span>
                      <span style={{ fontWeight: 500 }}>{form.contactPhone || "—"}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB: Documents & Verification (real uploads)
              ══════════════════════════════════════════ */}
          {activeTab === "documents" && (
            <div className="profile-section">

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
                  <span>Company Verification</span>
                  <span className="profile-status-badge pending">Pending Review</span>
                </div>
              </div>

              <p className="profile-section-label">Business Documents</p>

              {/* Hidden file inputs */}
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

              {/* Document upload slots */}
              {DOC_SLOTS.map((slot) => {
                const stored = docs[slot.key];
                const isUp   = uploading[slot.key] ?? false;
                const errMsg = docErrors[slot.key]  ?? "";
                const isPdf  = stored?.mimeType === "application/pdf";

                return (
                  <div key={slot.key} className="profile-doc-row">
                    <span style={{ fontWeight: 500 }}>{slot.label}</span>

                    <div className="profile-doc-actions">
                      <span className={`profile-status-badge ${stored ? "verified" : "pending"}`}>
                        {isUp ? "Uploading…" : stored ? "Uploaded" : "Not Uploaded"}
                      </span>

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

                      <button
                        className="secondary-btn"
                        style={{ padding: "6px 14px", fontSize: "0.8rem", marginLeft: "auto" }}
                        disabled={isUp}
                        onClick={() => docRefs[slot.key].current?.click()}
                      >
                        {isUp ? "Uploading…" : stored ? "Replace" : "Upload"}
                      </button>
                    </div>

                    {stored && !isUp && (
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>{stored.originalName}</span>
                        <span>·</span>
                        <span>{fmtBytes(stored.bytes)}</span>
                        <span>·</span>
                        <span>Uploaded {new Date(stored.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {errMsg && (
                      <p style={{ fontSize: "0.78rem", color: "var(--danger)", margin: 0 }}>{errMsg}</p>
                    )}

                    {!stored && !isUp && (
                      <p style={{ fontSize: "0.73rem", color: "var(--muted-foreground)", margin: 0 }}>{slot.hint}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: Security — Coming Soon items removed
              ══════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="profile-section">
              <p className="profile-section-label">C. Account Security</p>
              <div className="profile-action-list">
                <button className="profile-action-item" onClick={() => goTo("/portal/change-password")}>
                  <span>Change Password</span>
                  <span className="profile-action-arrow">›</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: More — Coming Soon + Help & Legal removed
              ══════════════════════════════════ */}
          {activeTab === "more" && (
            <div className="profile-section">
              <p className="profile-section-label">D. Hiring Management</p>
              <div className="profile-action-list">
                <button className="profile-action-item" onClick={() => goTo("/portal/jobs")}>
                  <span>Posted Jobs</span><span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-item" onClick={() => goTo("/portal/applications")}>
                  <span>Manage Applicants</span><span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-item" onClick={() => goTo("/portal/candidates")}>
                  <span>Browse Candidates</span><span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-item" onClick={() => goTo("/portal/analytics")}>
                  <span>Analytics Dashboard</span><span className="profile-action-arrow">›</span>
                </button>
              </div>

              <p className="profile-section-label">Account</p>
              <div className="profile-action-list">
                <button className="profile-action-item" onClick={() => goTo("/portal/company")}>
                  <span>Company Settings</span><span className="profile-action-arrow">›</span>
                </button>
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

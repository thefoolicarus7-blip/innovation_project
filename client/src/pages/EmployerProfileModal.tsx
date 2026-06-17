/**
 * EmployerProfileModal — Company / Employer profile slide-in drawer.
 *
 * Rendered by PortalLayout when the profile icon in the topbar is clicked.
 * Provides four tabs covering all required employer profile sections:
 *   Company · Documents · Security · More
 *
 * Design principles:
 *  - Zero changes to existing pages, routes, or Redux slices.
 *  - Features backed by existing pages are navigation links (goTo).
 *  - Reads company profile from the existing portalSlice Redux state.
 *  - Unimplemented features show a "Coming Soon" badge — no stub APIs.
 *  - All styles use existing CSS classes from styles.css plus the new
 *    .profile-panel-* / .profile-* classes added alongside this file.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import type { CompanyProfile } from "../types";

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = "company" | "documents" | "security" | "more";

const TABS: { id: Tab; label: string }[] = [
  { id: "company",   label: "Company"   },
  { id: "documents", label: "Documents" },
  { id: "security",  label: "Security"  },
  { id: "more",      label: "More"      },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface EmployerProfileModalProps {
  /** Called when the user clicks the backdrop or the close button. */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployerProfileModal({ onClose }: EmployerProfileModalProps) {
  const dispatch        = useAppDispatch();
  const navigate        = useNavigate();
  const user            = useAppSelector((state: any) => state.auth.user);
  // Company profile already loaded by PortalLayout via loadPortalData()
  const companyProfile  = useAppSelector(
    (state: any) => state.portal.companyProfile,
  ) as CompanyProfile | null;

  const [activeTab, setActiveTab] = useState<Tab>("company");

  // Avatar initial: first letter of company name or user name
  const initial =
    companyProfile?.companyName?.charAt(0)?.toUpperCase() ??
    user?.name?.charAt(0)?.toUpperCase() ??
    "C";

  /** Navigate to an internal route and close the panel. */
  const goTo = (path: string) => { onClose(); navigate(path); };

  const handleLogout = () => {
    dispatch(logoutUser());
    onClose();
    navigate("/");
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="profile-panel-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <div
        className="profile-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Employer Profile"
      >
        {/* ── Panel header ── */}
        <div className="profile-panel-header">
          <div>
            <h2>{companyProfile?.companyName ?? "My Company"}</h2>
            <p>{user?.email}</p>
          </div>
          <button
            className="profile-panel-close"
            onClick={onClose}
            aria-label="Close profile panel"
          >
            ✕
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="profile-panel-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`profile-tab-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div className="profile-panel-body">

          {/* ══════════════════════════════════
              TAB: Company Information
              ══════════════════════════════════ */}
          {activeTab === "company" && (
            <div className="profile-section">

              {/* Company logo / initial + summary */}
              <div className="profile-avatar-row">
                <div className="profile-avatar">{initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 2 }}>
                    {companyProfile?.companyName ?? user?.name ?? "—"}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 2 }}>
                    {companyProfile?.industry ?? "Company"}
                  </p>
                  {companyProfile?.website && (
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      {companyProfile.website}
                    </p>
                  )}
                </div>
              </div>

              {/* A. Company Information fields (read from Redux / portalSlice) */}
              <p className="profile-section-label">A. Company Information</p>
              <div style={{ display: "grid", gap: 8 }}>
                {(
                  [
                    ["Company Name",    companyProfile?.companyName],
                    ["Industry",        companyProfile?.industry],
                    ["Company Type",    companyProfile?.companyType],
                    ["Team Size",       companyProfile?.teamSize],
                    ["Address",         companyProfile?.address],
                    ["City",            companyProfile?.city],
                    ["Country",         companyProfile?.country],
                    ["Website",         companyProfile?.website],
                  ] as [string, string | undefined][]
                ).map(([label, value]) => (
                  <div key={label} className="profile-info-row">
                    <span>{label}</span>
                    <span style={{ fontWeight: 500, wordBreak: "break-all" }}>
                      {value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Company description */}
              {companyProfile?.about && (
                <>
                  <p className="profile-section-label">Company Description</p>
                  <div
                    className="profile-info-row"
                    style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}
                  >
                    <span>About</span>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5, marginTop: 4 }}>
                      {companyProfile.about}
                    </p>
                  </div>
                </>
              )}

              {/* Contact information */}
              <p className="profile-section-label">Contact Information</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div className="profile-info-row">
                  <span>Contact Email</span>
                  <span style={{ fontWeight: 500 }}>{user?.email ?? "—"}</span>
                </div>
                <div className="profile-info-row">
                  <span>Contact Phone</span>
                  <span style={{ fontWeight: 500 }}>—</span>
                </div>
              </div>

              {/* Link to existing CompanyProfilePage */}
              <div className="profile-action-list">
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/portal/company")}
                >
                  <span>Edit Company Profile</span>
                  <span className="profile-action-arrow">›</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: Documents & Verification
              ══════════════════════════════════ */}
          {activeTab === "documents" && (
            <div className="profile-section">

              {/* B. Documents & Verification */}
              <p className="profile-section-label">B. Verification Status</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div className="profile-info-row">
                  <span>Email Verification</span>
                  <span
                    className={`profile-status-badge ${
                      user?.isVerified === "true" ? "verified" : "pending"
                    }`}
                  >
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

              {/* Business registration document upload placeholder */}
              <div className="profile-doc-row">
                <span style={{ fontWeight: 500 }}>Business Registration Document</span>
                <div className="profile-doc-actions">
                  <span className="profile-status-badge pending">Not Uploaded</span>
                  <button
                    className="secondary-btn"
                    style={{ padding: "6px 14px", fontSize: "0.8rem", marginLeft: "auto" }}
                    disabled
                    title="Document upload coming soon"
                  >
                    Upload
                  </button>
                </div>
              </div>

              {/* Tax identification document upload placeholder */}
              <div className="profile-doc-row">
                <span style={{ fontWeight: 500 }}>Tax Identification Document</span>
                <div className="profile-doc-actions">
                  <span className="profile-status-badge pending">Not Uploaded</span>
                  <button
                    className="secondary-btn"
                    style={{ padding: "6px 14px", fontSize: "0.8rem", marginLeft: "auto" }}
                    disabled
                    title="Document upload coming soon"
                  >
                    Upload
                  </button>
                </div>
              </div>

              <p className="profile-note">
                Secure document verification is coming soon. Contact support to expedite company verification.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: Privacy & Security
              ══════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="profile-section">

              {/* C. Privacy & Security */}
              <p className="profile-section-label">C. Account Security</p>
              <div className="profile-action-list">
                {/* Change Password — uses the existing ChangePasswordPage */}
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/portal/change-password")}
                >
                  <span>Change Password</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Two-Factor Authentication (2FA)</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Login Activity</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Login History</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Active Sessions</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Notification Settings</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Email Notifications</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Account Privacy Controls</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: More / Other Features
              ══════════════════════════════════ */}
          {activeTab === "more" && (
            <div className="profile-section">

              {/* D. Hiring management — links to existing pages */}
              <p className="profile-section-label">D. Hiring Management</p>
              <div className="profile-action-list">
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/portal/jobs")}
                >
                  <span>Posted Jobs</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/portal/applications")}
                >
                  <span>Manage Applicants</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/portal/candidates")}
                >
                  <span>Browse Candidates</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/portal/analytics")}
                >
                  <span>Analytics Dashboard</span>
                  <span className="profile-action-arrow">›</span>
                </button>
              </div>

              <p className="profile-section-label">Account</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Subscription &amp; Billing</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/portal/company")}
                >
                  <span>Company Settings</span>
                  <span className="profile-action-arrow">›</span>
                </button>
              </div>

              <p className="profile-section-label">Help &amp; Legal</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Help &amp; Support</span>
                  <span className="profile-action-arrow">›</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Terms and Conditions</span>
                  <span className="profile-action-arrow">›</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Privacy Policy</span>
                  <span className="profile-action-arrow">›</span>
                </div>
              </div>

              <div className="profile-divider" />

              {/* Logout — reuses existing logoutUser thunk */}
              <button
                className="secondary-btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  color: "var(--danger)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                }}
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

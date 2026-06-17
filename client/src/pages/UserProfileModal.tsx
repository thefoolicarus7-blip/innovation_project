/**
 * UserProfileModal — Job Seeker profile slide-in drawer.
 *
 * Rendered by UserLayout when the profile icon in the topbar is clicked.
 * Provides four tabs covering all required profile sections:
 *   Personal · Documents · Security · More
 *
 * Design principles:
 *  - Zero changes to existing pages, routes, or Redux slices.
 *  - Features backed by existing pages are navigation links (goTo).
 *  - Unimplemented features show a "Coming Soon" badge — no stub APIs.
 *  - All styles use existing CSS classes from styles.css plus the new
 *    .profile-panel-* / .profile-* classes added alongside this file.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = "personal" | "documents" | "security" | "more";

const TABS: { id: Tab; label: string }[] = [
  { id: "personal",  label: "Personal"  },
  { id: "documents", label: "Documents" },
  { id: "security",  label: "Security"  },
  { id: "more",      label: "More"      },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface UserProfileModalProps {
  /** Called when the user clicks the backdrop or the close button. */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const user       = useAppSelector((state: any) => state.auth.user);

  const [activeTab, setActiveTab] = useState<Tab>("personal");

  // First letter of the user's name used as the avatar initial
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  // Rough completion percentage based on available auth data
  const completionPct = Math.min(
    100,
    (user?.name ? 20 : 0) +
    (user?.email ? 20 : 0) +
    (user?.isVerified === "true" ? 20 : 0),
  );

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
        aria-label="Job Seeker Profile"
      >
        {/* ── Panel header ── */}
        <div className="profile-panel-header">
          <div>
            <h2>My Profile</h2>
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
              TAB: Personal Information
              ══════════════════════════════════ */}
          {activeTab === "personal" && (
            <div className="profile-section">

              {/* Avatar + completion */}
              <div className="profile-avatar-row">
                <div className="profile-avatar">{initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 2 }}>
                    {user?.name ?? "—"}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 8 }}>
                    Job Seeker
                  </p>
                  {/* Profile completion bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted-foreground)", marginBottom: 4 }}>
                    <span>Profile completion</span>
                    <span>{completionPct}%</span>
                  </div>
                  <div className="profile-completion-track">
                    <div
                      className="profile-completion-fill"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Personal fields (read-only; sourced from auth state / CV) */}
              <p className="profile-section-label">A. Personal Information</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div className="profile-info-row">
                  <span>Full Name</span>
                  <span style={{ fontWeight: 500 }}>{user?.name ?? "—"}</span>
                </div>
                <div className="profile-info-row">
                  <span>Email Address</span>
                  <span style={{ fontWeight: 500, wordBreak: "break-all" }}>{user?.email ?? "—"}</span>
                </div>
                <div className="profile-info-row">
                  <span>Phone Number</span>
                  <span style={{ fontWeight: 500 }}>—</span>
                </div>
                <div className="profile-info-row">
                  <span>Address</span>
                  <span style={{ fontWeight: 500 }}>—</span>
                </div>
                <div className="profile-info-row">
                  <span>Date of Birth</span>
                  <span style={{ fontWeight: 500 }}>—</span>
                </div>
              </div>

              {/* Action: go to CV Builder to fill in skills & experience */}
              <p className="profile-section-label">Skills &amp; Experience</p>
              <div className="profile-action-list">
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/user/cv-builder")}
                >
                  <span>Edit Skills &amp; Experience</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/user/cv-builder")}
                >
                  <span>Build / Update My CV</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/user/interview-prep")}
                >
                  <span>AI Interview Preparation</span>
                  <span className="profile-action-arrow">›</span>
                </button>
              </div>

              {/* Profile picture upload placeholder */}
              <p className="profile-section-label">Profile Picture</p>
              <div className="profile-doc-row">
                <div className="profile-avatar" style={{ width: 48, height: 48, fontSize: "1.1rem" }}>
                  {initial}
                </div>
                <div className="profile-doc-actions">
                  <span className="profile-status-badge pending">Default Avatar</span>
                  <button
                    className="secondary-btn"
                    style={{ padding: "6px 14px", fontSize: "0.8rem", marginLeft: "auto" }}
                    disabled
                    title="Photo upload coming soon"
                  >
                    Change Photo
                  </button>
                </div>
                <p className="profile-note" style={{ textAlign: "left" }}>
                  Photo upload coming soon.
                </p>
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
                  <span>Identity Verification</span>
                  <span className="profile-status-badge pending">Not Submitted</span>
                </div>
              </div>

              {/* Profile completion percentage shown here too */}
              <div className="profile-info-row">
                <span>Profile Completion</span>
                <span style={{ fontWeight: 600 }}>{completionPct}%</span>
              </div>

              <p className="profile-section-label">Document Uploads</p>

              {/* Resume / CV — links to existing CV Builder */}
              <div className="profile-doc-row">
                <span style={{ fontWeight: 500 }}>Resume / CV</span>
                <div className="profile-doc-actions">
                  <span className="profile-status-badge pending">Not Generated</span>
                  <button
                    className="secondary-btn"
                    style={{ padding: "6px 14px", fontSize: "0.8rem", marginLeft: "auto" }}
                    onClick={() => goTo("/user/cv-builder")}
                  >
                    Go to CV Builder
                  </button>
                </div>
              </div>

              {/* Other documents — upload placeholders */}
              {[
                "Certificates & Licenses",
                "Educational Documents",
                "Citizenship / Passport / National ID",
              ].map((doc) => (
                <div key={doc} className="profile-doc-row">
                  <span style={{ fontWeight: 500 }}>{doc}</span>
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
              ))}

              <p className="profile-note">
                Secure document storage is coming soon. Resume management is available in the CV Builder.
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
                  onClick={() => goTo("/user/change-password")}
                >
                  <span>Change Password</span>
                  <span className="profile-action-arrow">›</span>
                </button>

                {/* Placeholders for features not yet implemented */}
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
                <button
                  className="profile-action-item danger"
                  onClick={() => {
                    /* Account deactivation — to be wired to API when available */
                    alert("Account deactivation is not yet available. Please contact support.");
                  }}
                >
                  <span>Deactivate Account</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button
                  className="profile-action-item danger"
                  onClick={() => {
                    /* Account deletion — to be wired to API when available */
                    alert("Account deletion is not yet available. Please contact support.");
                  }}
                >
                  <span>Delete Account</span>
                  <span className="profile-action-arrow">›</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: More / Other Features
              ══════════════════════════════════ */}
          {activeTab === "more" && (
            <div className="profile-section">

              {/* D. Jobs & Applications — links to existing pages */}
              <p className="profile-section-label">D. Jobs &amp; Applications</p>
              <div className="profile-action-list">
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/user/dashboard")}
                >
                  <span>Browse Jobs</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button
                  className="profile-action-item"
                  onClick={() => goTo("/user/applications")}
                >
                  <span>Applied Jobs History</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Saved Jobs</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Bookmarked Employers</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Job Alerts &amp; Preferences</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Profile Settings</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Profile Visibility Settings</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Language Preferences</span>
                  <span className="profile-status-badge soon">Coming Soon</span>
                </div>
              </div>

              <p className="profile-section-label">Help &amp; Legal</p>
              <div className="profile-action-list">
                <div className="profile-action-item" style={{ cursor: "default" }}>
                  <span>Support &amp; Help Center</span>
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

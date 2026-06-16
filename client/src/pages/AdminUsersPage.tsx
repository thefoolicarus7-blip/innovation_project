import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchUnverifiedUsers,
  verifyUserThunk,
} from "../store/slices/adminSlice";

export function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const { unverifiedUsers, loading, error } = useAppSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    void dispatch(fetchUnverifiedUsers());
  }, [dispatch]);

  const handleVerify = (userId: string) => {
    if (window.confirm("Are you sure you want to verify this user?")) {
      void dispatch(verifyUserThunk(userId));
    }
  };

  if (loading && unverifiedUsers.length === 0) {
    return <p>Loading unverified users...</p>;
  }

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="section-head">
          <h2>Pending User Verifications</h2>
          <span className="pill">{unverifiedUsers.length} Pending</span>
        </div>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

        <div
          className="admin-verification-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {unverifiedUsers.map((user) => (
            <div
              key={user._id}
              className="verification-card"
              style={{
                background: "var(--card-raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "4px" }}>
                    {user.firstName} {user.lastName}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    {user.email}
                  </p>
                  {user.skills && user.skills.length > 0 && (
                    <div
                      className="skills-preview"
                      style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}
                    >
                      {user.skills.slice(0, 8).map((skill: string) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: "0.7rem",
                            background: "var(--primary-muted)",
                            color: "var(--primary)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            border: "1px solid var(--primary)",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 8 && (
                        <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                          +{user.skills.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  className="primary-btn"
                  style={{ padding: "8px 20px" }}
                  onClick={() => handleVerify(user._id)}
                >
                  Verify User
                </button>
              </div>

              <div
                className="previews-container"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div className="preview-box">
                  <p
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "var(--muted)",
                    }}
                  >
                    ID / SELFIE
                  </p>
                  <div
                    style={{
                      aspectRatio: "4/3",
                      background: "var(--muted-bg)",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {user.idUrl ? (
                      <img
                        src={user.idUrl}
                        alt="ID Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          color: "var(--muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No ID Uploaded
                      </div>
                    )}
                  </div>
                </div>

                <div className="preview-box">
                  <p
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "var(--muted)",
                    }}
                  >
                    CV DOCUMENT
                  </p>
                  <div
                    style={{
                      aspectRatio: "4/3",
                      background: "var(--muted-bg)",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      position: "relative",
                    }}
                  >
                    {user.cvUrl ? (
                      user.cvUrl.toLowerCase().endsWith(".pdf") ? (
                        <iframe
                          src={`${user.cvUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                          }}
                          title="CV Preview"
                        />
                      ) : (
                        <img
                          src={user.cvUrl}
                          alt="CV Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      )
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          color: "var(--muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No CV Uploaded
                      </div>
                    )}
                  </div>
                  {user.cvUrl && (
                    <a
                      href={user.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--primary)",
                        marginTop: "4px",
                        display: "inline-block",
                      }}
                    >
                      Open Full Document ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {unverifiedUsers.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "48px",
                color: "var(--muted)",
              }}
            >
              No pending user verifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

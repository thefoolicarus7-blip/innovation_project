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

        <div className="table-wrapper" style={{ marginTop: "24px" }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Verification Documents</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unverifiedUsers.map((user) => {
                const hasAnyDoc = !!(user.idUrl || user.cvUrl);
                return (
                  <tr key={user._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {user.firstName} {user.lastName}
                      </div>
                      {user.skills && user.skills.length > 0 && (
                        <div
                          style={{
                            marginTop: "6px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                          }}
                        >
                          {user.skills.slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              style={{
                                fontSize: "0.7rem",
                                background: "var(--primary-muted)",
                                color: "var(--primary)",
                                padding: "2px 6px",
                                borderRadius: "8px",
                                border: "1px solid var(--primary)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span
                              style={{ fontSize: "0.7rem", color: "var(--muted)" }}
                            >
                              +{user.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {!hasAnyDoc ? (
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                          No documents submitted
                        </span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {user.idUrl && (
                            <a
                              href={user.idUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="secondary-btn"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.78rem",
                                display: "inline-flex",
                              }}
                            >
                              ID / Selfie
                            </a>
                          )}
                          {user.cvUrl && (
                            <a
                              href={user.cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="secondary-btn"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.78rem",
                                display: "inline-flex",
                              }}
                            >
                              CV Document
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="primary-btn"
                        style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                        title="Verify this user"
                        onClick={() => handleVerify(user._id)}
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                );
              })}
              {unverifiedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center", color: "var(--muted)" }}
                  >
                    No pending user verifications.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

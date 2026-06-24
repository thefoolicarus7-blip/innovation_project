import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchUnverifiedCompanies,
  verifyUserThunk,
} from "../store/slices/adminSlice";

export function AdminCompaniesPage() {
  const dispatch = useAppDispatch();
  const { unverifiedCompanies, loading, error } = useAppSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    void dispatch(fetchUnverifiedCompanies());
  }, [dispatch]);

  const handleVerify = (userId: string) => {
    if (window.confirm("Are you sure you want to verify this company?")) {
      void dispatch(verifyUserThunk(userId));
    }
  };

  if (loading && unverifiedCompanies.length === 0) {
    return <p>Loading unverified companies...</p>;
  }

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="section-head">
          <h2>Pending Company Verifications</h2>
          <span className="pill">{unverifiedCompanies.length} Pending</span>
        </div>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Owner Email</th>
                <th>Verification Documents</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unverifiedCompanies.map((item) => {
                const bizDoc = (item.profile as any)?.businessRegDocUrl as string | undefined;
                const taxDoc = (item.profile as any)?.taxIdDocUrl       as string | undefined;
                const hasAnyDoc = !!(bizDoc || taxDoc);

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.profile?.companyName || "N/A"}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        {item.profile?.industry || "—"}{item.profile?.website ? " · " : ""}
                        {item.profile?.website && (
                          <a href={item.profile.website} target="_blank" rel="noreferrer"
                            style={{ color: "var(--primary)" }}>Website</a>
                        )}
                      </div>
                    </td>
                    <td>{item.email}</td>
                    <td>
                      {!hasAnyDoc ? (
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No documents submitted</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {bizDoc && (
                            <a href={bizDoc} target="_blank" rel="noreferrer"
                              className="secondary-btn"
                              style={{ padding: "4px 10px", fontSize: "0.78rem", display: "inline-flex" }}>
                              Business Registration
                            </a>
                          )}
                          {taxDoc && (
                            <a href={taxDoc} target="_blank" rel="noreferrer"
                              className="secondary-btn"
                              style={{ padding: "4px 10px", fontSize: "0.78rem", display: "inline-flex" }}>
                              Tax Identification
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="primary-btn"
                        style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                        title="Verify this company"
                        onClick={() => handleVerify(item.id)}
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                );
              })}
              {unverifiedCompanies.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>
                    No pending company verifications.
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

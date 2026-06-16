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
                <th>Company Name</th>
                <th>Industry</th>
                <th>Owner Email</th>
                <th>Website</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unverifiedCompanies.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>
                    {item.profile?.companyName || "N/A"}
                  </td>
                  <td>{item.profile?.industry || "N/A"}</td>
                  <td>{item.email}</td>
                  <td>
                    {item.profile?.website ? (
                      <a
                        href={item.profile.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--primary)" }}
                      >
                        Visit
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <button
                      className="primary-btn"
                      style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                      onClick={() => handleVerify(item.id)}
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
              {unverifiedCompanies.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", color: "var(--muted)" }}
                  >
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

import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import { loadPortalData } from "../store/slices/portalSlice";

const navItems = [
  { to: "/portal/jobs", label: "Jobs" },
  { to: "/portal/applications", label: "Applications" },
  { to: "/portal/candidates", label: "Candidates" },
  { to: "/portal/analytics", label: "Analytics" },
  { to: "/portal/company", label: "Company Profile" },
];

export function PortalLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const loading = useAppSelector((state: any) => state.portal.loading);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "company") {
      void dispatch(loadPortalData());
    }
  }, [dispatch, user?.role]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="brand">
            <div className="brand-mark">s2w</div>
            <div>
              <h2>swipe2work Portal</h2>
              <span>Company Workspace</span>
            </div>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-group-title">Navigation</p>
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <span className="nav-dot" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-user-card">
              <p>{user?.name}</p>
              <small>{user?.role?.toUpperCase()}</small>
            </div>
            <button
              className="secondary-btn sidebar-logout"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="portal-main">
        <header className="topbar">
          <div className="section-head">
            <div>
              <h1>Workspace</h1>
              <p>Curate your hiring experience at Nysa.</p>
            </div>
            <div className="chip-list">
              <span className="pill">Role: {user?.role ?? "guest"}</span>
              <span className="pill">Status: Active</span>
            </div>
          </div>
        </header>

        <section className="portal-content">
          {loading ? <p>Loading portal data...</p> : <Outlet />}
        </section>
      </main>
    </div>
  );
}

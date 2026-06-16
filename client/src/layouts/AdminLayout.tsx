import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";

const navItems = [
  { to: "/admin/users", label: "User Verification" },
  { to: "/admin/companies", label: "Company Verification" },
];

export function AdminLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="brand">
            <div className="brand-mark" style={{ background: "var(--danger)" }}>
              A
            </div>
            <div>
              <h2>swipe2work Admin</h2>
              <span>Control Panel</span>
            </div>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-group-title">KYC Management</p>
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
              <small>ADMINISTRATOR</small>
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
              <h1>Admin Dashboard</h1>
              <p>Review and verify platform entities.</p>
            </div>
          </div>
        </header>

        <section className="portal-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

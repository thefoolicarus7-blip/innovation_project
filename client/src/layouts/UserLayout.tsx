import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import { loadUserJobs } from "../store/slices/userSlice";

const navItems = [
  { to: "/user/dashboard", label: "Dashboard" },
  { to: "/user/applications", label: "My Applications" },
  { to: "/user/cv-builder", label: "Build My CV" },
  { to: "/user/interview-prep", label: "AI Interview Prep" },
  { to: "/user/change-password", label: "Change Password" },
];

export function UserLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const loading = useAppSelector((state: any) => state.user.jobsLoading);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "User") {
      void dispatch(loadUserJobs());
    }
  }, [dispatch, user?.role]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  return (
    <div className="portal-shell user-shell">
      <aside className="sidebar user-sidebar">
        <div className="sidebar-inner">
          <div className="brand">
            <div className="brand-mark">s2w</div>
            <div>
              <h2>swipe2work</h2>
              <span>Job Seeker</span>
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

      <main className="portal-main user-main">
        <header className="topbar">
          <div className="section-head">
            <div>
              <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
              <p>Find your next opportunity.</p>
            </div>
          </div>
        </header>

        <section className="portal-content">
          {loading ? <p>Loading your space...</p> : <Outlet />}
        </section>
      </main>
    </div>
  );
}

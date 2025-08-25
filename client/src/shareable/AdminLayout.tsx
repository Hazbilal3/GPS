import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutGrid,
  LuUsers,
  LuTrendingUp,
  LuFolder,
  LuUpload,
  LuSettings,
  LuLogOut,
  LuMenu,
} from "react-icons/lu";
import "../assets/components-css/Dashboard.css";
import cmjl from "../assets/pics/dashboard-logo.png";

type AdminLayoutProps = {
  title?: string;
  children: React.ReactNode;
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? "260px" : "76px";

  const adminFirstName =
    localStorage.getItem("firstname") ||
    localStorage.getItem("firstName") ||
    "Admin";

  const menuItems = [
    { to: "/dashboard", label: "Overview", icon: <LuLayoutGrid /> },
    { to: "/drivers", label: "Drivers", icon: <LuUsers /> },
    // { to: "/dashboard", label: "Results", icon: <LuTrendingUp /> },
    // { to: "/dashboard", label: "Upload", icon: <LuUpload /> },
    // { to: "/dashboard", label: "Files", icon: <LuFolder /> },
    // { to: "/dashboard", label: "Settings", icon: <LuSettings /> },
  ];

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("firstname");
    localStorage.removeItem("firstName");
    try {
      navigate("/");
    } catch {
      window.location.href = "/";
    }
  }

  return (
    <div
      className={`admin-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}
      style={{ ["--sidebar-current-w" as any]: sidebarWidth }}
    >
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <img src={cmjl} alt="CMJL" className="brand-img" />
            {sidebarOpen && <div className="brand-title"></div>}
            <button
              type="button"
              className="btn-toggle"
              onClick={() => setSidebarOpen((s) => !s)}
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <LuMenu />
            </button>
          </div>

          <nav className="sidebar-menu py-3">
            <ul>
              {menuItems.map((m) => (
                <li key={m.to}>
                  <NavLink
                    to={m.to}
                    className="menu-link"
                    title={!sidebarOpen ? m.label : undefined}
                  >
                    <span className="menu-icon">{m.icon}</span>
                    {sidebarOpen && (
                      <span className="menu-text">{m.label}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <button
              className="menu-link logout"
              onClick={handleLogout}
              title={!sidebarOpen ? "Logout" : undefined}
            >
              <span className="menu-icon">
                <LuLogOut />
              </span>
              {sidebarOpen && <span className="menu-text">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <h1>Welcome to CMJL</h1>
          </div>
          <div className="topbar-right">
            <div className="profile-avatar" />
            <div className="profile-name">{adminFirstName}</div>
          </div>
        </header>

        <main className="content-surface">
          {title && <h2 className="content-title">{title}</h2>}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

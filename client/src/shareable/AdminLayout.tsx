import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutGrid,
  LuUsers,
  // LuTrendingUp,
  // LuFolder,
  LuUpload,
  // LuSettings,
  LuUser   ,
  LuLogOut,
  LuMenu,
} from "react-icons/lu";
import "../assets/components-css/Dashboard.css";
import cmjl from "../assets/pics/dashboard-logo.png";

type MenuItem = {
  to?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

type AdminLayoutProps = {
  title?: string;
  children: React.ReactNode;
  variant?: "admin" | "driver";
  rightNameOverride?: string;
  menuOverride?: MenuItem[];
};

const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  children,
  variant = "admin",
  rightNameOverride,
  menuOverride,
}) => {
  const navigate = useNavigate();

  const initialOpen =
    typeof window !== "undefined" ? window.innerWidth >= 992 : true;
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(initialOpen);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sidebarWidth = sidebarOpen ? "260px" : "76px";

  const adminFirstName =
    localStorage.getItem("firstname") ||
    localStorage.getItem("firstName") ||
    "Admin";

  const rightName =
    rightNameOverride || (variant === "driver" ? "Driver" : adminFirstName);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("firstname");
    localStorage.removeItem("firstName");
    localStorage.removeItem("driverId");
    localStorage.removeItem("userId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("driverName");
    try {
      navigate("/");
    } catch {
      window.location.href = "/";
    }
  }

  const adminMenu: MenuItem[] = [
    { to: "/dashboard", label: "Overview", icon: <LuLayoutGrid /> },
    { to: "/drivers", label: "Drivers", icon: <LuUsers /> },
    // { to: "/dashboard", label: "Results", icon: <LuTrendingUp /> },
    { to: "/upload", label: "Upload", icon: <LuUpload /> },
    // { to: "/dashboard", label: "Files", icon: <LuFolder /> },
    // { to: "/settings", label: "Settings", icon: <LuSettings /> },
  ];

  const driverMenu: MenuItem[] = [
    { to: "/upload", label: "Upload", icon: <LuUpload /> },
    // { to: "/settings", label: "Settings", icon: <LuSettings /> },
  ];

  const menuItems = useMemo(
    () => menuOverride ?? (variant === "driver" ? driverMenu : adminMenu),
    [menuOverride, variant]
  );

  return (
    <div
      className={`admin-shell ${
        sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
      }`}
      style={{ ["--sidebar-current-w" as any]: sidebarWidth }}
    >
      <aside
        className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"}`}
        aria-hidden={!sidebarOpen}
      >
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <img src={cmjl} alt="CMJL" className="brand-img" />
            {sidebarOpen && <div className="brand-title" />}
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
                <li key={m.label}>
                  {m.onClick ? (
                    <button
                      className="menu-link as-button"
                      onClick={() => {
                        m.onClick?.();
                        if (window.innerWidth < 992) setSidebarOpen(false);
                      }}
                      title={!sidebarOpen ? m.label : undefined}
                    >
                      <span className="menu-icon">{m.icon}</span>
                      {sidebarOpen && (
                        <span className="menu-text">{m.label}</span>
                      )}
                    </button>
                  ) : (
                    <NavLink
                      to={m.to || "#"}
                      className="menu-link"
                      title={!sidebarOpen ? m.label : undefined}
                      onClick={() => {
                        if (window.innerWidth < 992) setSidebarOpen(false);
                      }}
                    >
                      <span className="menu-icon">{m.icon}</span>
                      {sidebarOpen && (
                        <span className="menu-text">{m.label}</span>
                      )}
                    </NavLink>
                  )}
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

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="btn btn-outline-light topbar-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <LuMenu />
          </button>

          <div className="topbar-left">
            <h1>Welcome to CMJL</h1>
          </div>
          <div className="topbar-right">
            <div className="profile-avatar" >
                <LuUser   />
  </div>
            <div className="profile-name">{rightName}</div>
          </div>
        </header>

        <main className="content-surface">
          {title && <h2 className="content-title">{title}</h2>}
          {children}
        </main>
      </div>

      <button
        className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`}
        aria-label="Close menu"
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;

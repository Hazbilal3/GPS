import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  getDriverReport,
  exportDriverReport,
  type DriverReportRow,
} from "../services/adminApi";
import {
  LuLayoutGrid,
  LuUsers,
  LuTrendingUp,
  LuFolder,
  LuUpload,
  LuSettings,
  LuLogOut,
  LuMenu,
  LuSlidersHorizontal,
} from "react-icons/lu";
import "../assets/components-css/Dashboard.css";
import cmjl from "../assets/pics/dashboard-logo.png";

type DriverOption = { id: number; label: string };

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const PAGE_WINDOW = 7;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? "260px" : "76px";

  const adminFirstName =
    localStorage.getItem("firstname") ||
    localStorage.getItem("firstName") ||
    "Admin";

  const [driverId, setDriverId] = useState<string>("");
  const [date, setDate] = useState<string>(toYMD(new Date()));
  const [statusFilter, setStatusFilter] = useState<
    "all" | "match" | "mismatch"
  >("all");

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [rows, setRows] = useState<DriverReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  useEffect(() => {
    const BASE_URL =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3008";
    const run = async () => {
      try {
        const res = await fetch(`${BASE_URL}/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch drivers");
        const data = await res.json();
        const opts = (Array.isArray(data) ? data : data?.data ?? [])
          .map((d: any) => {
            const idNum = Number(d.id ?? d.userId ?? d.driverId);
            if (Number.isNaN(idNum)) return null;

            const fullName = d.fullName || "";

            return {
              id: idNum,
              label: `${fullName} (${idNum})`,
            };
          })
          .filter(Boolean) as DriverOption[];

        setDrivers(opts);
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [token]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => {
      const v = (r.status || "").toString().toLowerCase();
      const isMatch = v === "match" || v === "matched";
      return statusFilter === "match" ? isMatch : !isMatch;
    });
  }, [rows, statusFilter]);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!driverId) {
      setError("Please select a driver.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { rows: data, total } = await getDriverReport({
        driverId: Number(driverId),
        date,
        page,
        limit,
        token,
      });
      setRows(data);
      setTotal(total);
    } catch (err: any) {
      setRows([]);
      setTotal(undefined);
      setError(err?.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (driverId) handleSearch();
  }, [page, limit]);

  async function handleExport() {
    try {
      if (!driverId) {
        setError("Cannot export: please select a driver.");
        return;
      }
      setError(null);
      const blob = await exportDriverReport({
        driverId: Number(driverId),
        date,
        token,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uploads-report_${driverId}_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Export failed.");
    }
  }

  const totalPages = total && limit ? Math.max(1, Math.ceil(total / limit)) : 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageNumbers = useMemo(() => {
    const half = Math.floor(PAGE_WINDOW / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + PAGE_WINDOW - 1);
    if (end - start + 1 < PAGE_WINDOW)
      start = Math.max(1, end - PAGE_WINDOW + 1);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

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

  const menuItems = [
    { to: "/dashboard", label: "Overview", icon: <LuLayoutGrid /> },
    { to: "/drivers", label: "Drivers", icon: <LuUsers /> },
    { to: "/results", label: "Results", icon: <LuTrendingUp /> },
    { to: "/upload", label: "Upload", icon: <LuUpload /> },
    { to: "/files", label: "Files", icon: <LuFolder /> },
    { to: "/settings", label: "Settings", icon: <LuSettings /> },
  ];

  return (
    <div
      className={`admin-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}
      style={{ ["--sidebar-current-w" as any]: sidebarWidth }}
    >
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

          {sidebarOpen && (
            <div className="sidebar-search">
              <input
                className="form-control form-control-sm"
                placeholder="Search..."
              />
            </div>
          )}

          <nav className="sidebar-menu">
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
          <h2 className="content-title">Overview</h2>

          <form onSubmit={handleSearch} className="card p-3">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label">Select Driver</label>
                <select
                  className="form-select"
                  value={driverId}
                  onChange={(e) => {
                    setDriverId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="col-12 col-sm-5 col-md-5 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1">
                  Search
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleExport}
                >
                  Export csv
                </button>

                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle"
                    data-bs-toggle="dropdown"
                    type="button"
                  >
                    <LuSlidersHorizontal />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button
                        className={`dropdown-item ${
                          statusFilter === "all" ? "active" : ""
                        }`}
                        type="button"
                        onClick={() => setStatusFilter("all")}
                      >
                        All
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          statusFilter === "match" ? "active" : ""
                        }`}
                        type="button"
                        onClick={() => setStatusFilter("match")}
                      >
                        Match
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          statusFilter === "mismatch" ? "active" : ""
                        }`}
                        type="button"
                        onClick={() => setStatusFilter("mismatch")}
                      >
                        Mismatch
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>
            )}
          </form>

          <div className="card mt-3">
            <div className="table-responsive">
              <table className="table table-borderless align-middle mb-0 custom-table">
                <thead>
                  <tr>
                    <th>Barcode</th>
                    <th>Address</th>
                    <th>GPS Location</th>
                    <th>Expected Location</th>
                    <th>Distance (km)</th>
                    <th>Status</th>
                    <th className="text-end">Google Maps Link</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-muted">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-muted">
                        No data
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, i) => {
                      const v = (r.status || "").toString().toLowerCase();
                      const isMatch = v === "match" || v === "matched";
                      return (
                        <tr key={`${r.barcode}-${i}`}>
                          <td>{r.barcode ?? ""}</td>
                          <td className="text-wrap" style={{ maxWidth: 280 }}>
                            {r.address ?? ""}
                          </td>
                          <td>{r.lastGpsLocation ?? ""}</td>
                          <td>{r.expectedLocation ?? ""}</td>
                          <td>{r.distanceKm ?? ""}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                isMatch ? "status-match" : "status-mismatch"
                              }`}
                            >
                              {isMatch ? "Match" : "Mismatch"}
                            </span>
                          </td>
                          <td className="text-end">
                            {r.mapsUrl ? (
                              <a
                                className="btn btn-sm btn-outline-primary"
                                href={r.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Map
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Rows per page</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pagination-bar d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!canPrev}
                  onClick={() => canPrev && setPage((p) => p - 1)}
                >
                  ‹ Previous
                </button>

                <ul className="pagination pagination-sm mb-0">
                  {pageNumbers[0] > 1 && (
                    <>
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => setPage(1)}
                        >
                          1
                        </button>
                      </li>
                      {pageNumbers[0] > 2 && (
                        <li className="page-item disabled">
                          <span className="page-link">…</span>
                        </li>
                      )}
                    </>
                  )}

                  {pageNumbers.map((n) => (
                    <li
                      key={n}
                      className={`page-item ${n === page ? "active" : ""}`}
                    >
                      <button className="page-link" onClick={() => setPage(n)}>
                        {n}
                      </button>
                    </li>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <li className="page-item disabled">
                          <span className="page-link">…</span>
                        </li>
                      )}
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => setPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </li>
                    </>
                  )}
                </ul>

                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!canNext}
                  onClick={() => canNext && setPage((p) => p + 1)}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

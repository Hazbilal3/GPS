import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import {
  getDriverReport,
  exportDriverReport,
  type DriverReportRow,
} from "../services/adminApi";
import { LuSlidersHorizontal } from "react-icons/lu";
import "../assets/components-css/Dashboard.css";

type DriverOption = { id: number; label: string };

const PAGE_WINDOW = 7;
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const Dashboard: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  // filters
  const [driverId, setDriverId] = useState<string>("");
  const [date, setDate] = useState<string>(toYMD(new Date()));
  const [statusFilter, setStatusFilter] = useState<"all" | "match" | "mismatch">(
    "all"
  );

  // data + ui
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [rows, setRows] = useState<DriverReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination (client-side over filtered rows)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ---- Fetch drivers for dropdown ----
  useEffect(() => {
    const BASE_URL =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3008";
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch drivers");
        const data = await res.json();
        const list = (Array.isArray(data) ? data : data?.data ?? [])
          .map((d: any) => {
            const id = Number(d.id ?? d.userId ?? d.driverId);
            if (Number.isNaN(id)) return null;
            const fullName = d.fullName || "";
            return { id, label: `${fullName} (${id})` };
          })
          .filter(Boolean) as DriverOption[];
        setDrivers(list);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          // keep console for diagnostics
          console.error(e);
        }
      }
    })();

    return () => ac.abort();
  }, [token]);

  // ---- Derived rows (filter, paginate) ----
  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => {
      const v = (r.status || "").toString().toLowerCase();
      const isMatch = v === "match" || v === "matched";
      return statusFilter === "match" ? isMatch : !isMatch;
    });
  }, [rows, statusFilter]);

  const totalFiltered = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, page, limit]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pageNumbers = useMemo(() => {
    const half = Math.floor(PAGE_WINDOW / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + PAGE_WINDOW - 1);
    if (end - start + 1 < PAGE_WINDOW) start = Math.max(1, end - PAGE_WINDOW + 1);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  // ---- Actions ----
  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!driverId) {
        setError("Please select a driver.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const { rows: data } = await getDriverReport({
          driverId: Number(driverId),
          date,
          page: 1, // fetch once; we paginate client-side
          limit: 10000, // large chunk (keep if backend supports)
          token,
        });
        setRows(data ?? []);
        setPage(1);
      } catch (err: any) {
        setRows([]);
        setError(err?.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    },
    [driverId, date, token]
  );

  const handleExport = useCallback(async () => {
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
  }, [driverId, date, token]);

  // ---- Render ----
  return (
    <AdminLayout title="Overview">
      {/* Filters */}
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
            <button type="button" className="btn btn-outline-primary" onClick={handleExport}>
              Export csv
            </button>

            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                data-bs-toggle="dropdown"
                type="button"
                aria-expanded="false"
              >
                <LuSlidersHorizontal />
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className={`dropdown-item ${statusFilter === "all" ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setPage(1);
                    }}
                  >
                    All
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${statusFilter === "match" ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      setStatusFilter("match");
                      setPage(1);
                    }}
                  >
                    Match
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${statusFilter === "mismatch" ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      setStatusFilter("mismatch");
                      setPage(1);
                    }}
                  >
                    Mismatch
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}
      </form>

      {/* Table */}
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
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted">
                    No data
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, i) => {
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
                          className={`status-badge ${isMatch ? "status-match" : "status-mismatch"}`}
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

        {/* Pagination */}
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
                    <button className="page-link" onClick={() => setPage(1)}>
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
                <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
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
                    <button className="page-link" onClick={() => setPage(totalPages)}>
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
    </AdminLayout>
  );
};

export default Dashboard;

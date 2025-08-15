import React, { useEffect, useMemo, useState } from "react";
import { getDriverReport, exportDriverReport, type DriverReportRow } from "../services/adminApi";

const COLUMNS = [
  { key: "barcode", label: "Barcode" },
  { key: "address", label: "Address" },
  { key: "lastGpsLocation", label: "Last GPS location" },
  { key: "expectedLocation", label: "Expected Location" },
  { key: "distanceKm", label: "Distance (km)" },
  { key: "status", label: "Status" },
  { key: "mapsUrl", label: "Google Maps Link" },
] as const;

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const Dashboard: React.FC = () => {
  const [driverId, setDriverId] = useState<string>("");
  const [date, setDate] = useState<string>(toYMD(new Date()));

  const [rows, setRows] = useState<DriverReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  const canSearch = driverId.trim() !== "" && !Number.isNaN(Number(driverId)) && !!token;

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch) {
      setError("Please provide a valid numeric Driver ID.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { rows: data, total } = await getDriverReport({
        driverId: Number(driverId),
        date, // sent as same-day startDate/endDate
        page,
        limit,
        token,
      });
      setRows(data);
      setTotal(total);
    } catch (err: any) {
      setRows([]);
      setTotal(undefined);
      setError(err?.message || "Failed to fetch report.");
    } finally {
      setLoading(false);
    }
  };

  // When driver/date changes, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [driverId, date, limit]);

  // Re-query when page changes (after first search)
  useEffect(() => {
    if (canSearch) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleExport = async () => {
    try {
      if (!canSearch) {
        setError("Cannot export: please enter a valid Driver ID.");
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
      a.download = `report_driver_${driverId}_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Export failed.");
    }
  };

  const totalPages = total && limit ? Math.max(1, Math.ceil(total / limit)) : undefined;

  return (
    <div className="page">
      <div className="page-inner">
        <h2 style={{ color: "var(--brand-white, #fff)", marginBottom: 16 }}>Admin Dashboard</h2>

        <form
          onSubmit={handleSearch}
          className="card-surface p-3"
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr 1fr auto auto",
            alignItems: "end",
            marginBottom: 16,
          }}
        >
          <div>
            <label className="form-label">Driver ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 123"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={toYMD(new Date())}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleExport}>
            Export CSV
          </button>

          {error && (
            <div className="alert alert-danger py-2" style={{ gridColumn: "1 / -1", margin: 0 }}>
              {error}
            </div>
          )}
        </form>

        {/* Pagination controls */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="text-white-50">Rows per page</span>
            <select
              className="form-select"
              style={{ width: 90 }}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          {totalPages && (
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-sm btn-outline-light" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ‹ Prev
              </button>
              <span className="text-white-50">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-light"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ›
              </button>
            </div>
          )}
        </div>

        <div className="response-table-wrapper">
          <div className="table-scroll-container">
            <table className="styled-table">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} style={{ textAlign: "center", padding: 20 }}>
                      {loading ? "Loading…" : "No data"}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i}>
                      {COLUMNS.map((c) => {
                        const value = (r as any)[c.key];
                        if (c.key === "mapsUrl" && value) {
                          return (
                            <td key={c.key}>
                              <a href={String(value)} target="_blank" rel="noopener noreferrer">
                                View Map
                              </a>
                            </td>
                          );
                        }
                        return <td key={c.key}>{value ?? ""}</td>;
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

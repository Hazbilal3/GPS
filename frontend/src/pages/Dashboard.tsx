import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AdminLayout from "../shareable/AdminLayout";
import {
  getDriverReport,
  exportDriverReport,
  type DriverReportRow as BaseDriverReportRow,
} from "../services/adminApi";
import { LuSlidersHorizontal, LuX } from "react-icons/lu";
import "../assets/components-css/Dashboard.css";
import { port } from "../port.interface";

type DriverOption = { id: number; label: string };

type DriverReportRow = BaseDriverReportRow & {
  proofImage?: string;
  proofUrl?: string;
  proof?: string;
};

const PAGE_WINDOW = 7;
const MAP_HEIGHT = 320;
const PANEL_PADDING = 12;
const HEADER_H = 40;
const FOOTER_H = 84;
const PANEL_H = HEADER_H + MAP_HEIGHT + FOOTER_H;

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const DEFAULT_EMBED =
  "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14473.199485265202!2d67.1298786!3d24.921852400000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1755878790281!5m2!1sen!2s";

function toEmbedUrl(row: DriverReportRow): string {
  const raw = (row.mapsUrl || "").trim();
  if (raw && /\/maps\/embed/i.test(raw)) return raw;

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const origin = (row.lastGpsLocation || "").toString().trim();

  const destination = (row.expectedLocation || "").toString().trim();

  if (API_KEY && origin && destination) {
    return `https://www.google.com/maps/embed/v1/directions?key=${API_KEY}&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&mode=driving`;
  }

  const single = destination || origin || (row.address || "").toString().trim();
  if (API_KEY && single) {
    return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(
      single
    )}`;
  }

  return DEFAULT_EMBED;
}

const Dashboard: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  const [driverId, setDriverId] = useState("");
  const [date, setDate] = useState(toYMD(new Date()));
  
  const [statusFilter, setStatusFilter] = useState<
    "all" | "match" | "mismatch" | "delivered" | "attempted"
  >("all");
  const [globalQuery, setGlobalQuery] = useState("");

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [rows, setRows] = useState<DriverReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [queried, setQueried] = useState(false);
  const [allRows, setAllRows] = useState<DriverReportRow[] | null>(null);

  const [showMap, setShowMap] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DriverReportRow | null>(null);
  const [mapSrc, setMapSrc] = useState("");
  const [showProof, setShowProof] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [panelTop, setPanelTop] = useState(PANEL_PADDING);

  useEffect(() => {
    const BASE_URL = port;
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
            return { id, label: `${d.fullName || ""} (${id})` };
          })
          .filter(Boolean) as DriverOption[];
        setDrivers(list);
      } catch (e) {
        if (
          !(
            e instanceof DOMException &&
            (e as DOMException).name === "AbortError"
          )
        ) {
          console.error(e);
        }
      }
    })();

    return () => ac.abort();
  }, [token]);

  const driverName = useMemo(() => {
    const found = drivers.find((d) => String(d.id) === String(driverId));
    if (!found) return "";
    const idx = found.label.lastIndexOf(" (");
    return idx > 0 ? found.label.slice(0, idx) : found.label;
  }, [drivers, driverId]);

  const needAllRows = useMemo(
    () => globalQuery.trim().length > 0 || statusFilter !== "all",
    [globalQuery, statusFilter]
  );

  const fetchPage = useCallback(
    async (pageArg: number, limitArg: number) => {
      const { rows: data, total: apiTotal } = await getDriverReport({
        driverId: Number(driverId),
        date,
        page: pageArg,
        limit: limitArg,
        token,
      });
      return {
        data: (data ?? []) as DriverReportRow[],
        total: typeof apiTotal === "number" ? apiTotal : (data ?? []).length,
      };
    },
    [driverId, date, token]
  );

  const fetchAll = useCallback(async () => {
    const first = await fetchPage(1, 200);
    let combined = [...first.data];
    const totalCount = first.total;
    const totalPagesNeeded = Math.max(1, Math.ceil(totalCount / 200));
    for (let p = 2; p <= totalPagesNeeded; p++) {
      const next = await fetchPage(p, 200);
      combined = combined.concat(next.data);
    }
    return combined;
  }, [fetchPage]);

  // --- FIX: Replaced fetchReport logic with two separate useEffect hooks ---

  // Effect 1: Handles API-side pagination (when no filter is active)
  useEffect(() => {
    if (!queried || !driverId || needAllRows) {
      // Do nothing if filters are active, the other effect will handle it.
      return;
    }

    const runFetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, total: apiTotal } = await fetchPage(page, limit);
        setAllRows(null); // Clear allRows
        setRows(data);
        setTotal(apiTotal);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch data.");
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    runFetchPage();
  }, [queried, driverId, date, page, limit, needAllRows, fetchPage]);

  // Effect 2: Handles fetching ALL data for client-side filtering
  useEffect(() => {
    if (!queried || !driverId || !needAllRows) {
      // Do nothing if filters are NOT active.
      return;
    }
    
    // This effect runs when data source changes (driver, date) or when
    // filters are first applied (needAllRows becomes true).
    // It does NOT depend on `page` or `limit`.

    const runFetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const all = await fetchAll();
        setAllRows(all);
        setRows([]); // Clear `rows` as we are in `allRows` mode
        // `effectiveTotal` will be set by `filteredRows.length`
      } catch (err: any) {
        setError(err?.message || "Failed to fetch data.");
        setAllRows(null);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    runFetchAll();
  }, [queried, driverId, date, needAllRows, fetchAll]); // `page` and `limit` are intentionally removed

  // --- END FIX ---


  const filteredRows: DriverReportRow[] = useMemo(() => {
    // When needAllRows is true, base is allRows.
    // When needAllRows is false, base is rows (the current page).
    let base = needAllRows ? allRows || [] : rows;

    if (statusFilter !== "all") {
      base = base.filter((r) => {
        const scanStatus = String(r.status || "").toLowerCase();
        // Handle "matched" as well as "match"
        const isMatch = scanStatus === "match" || scanStatus === "matched";
        const lastEvent = String(r.lastevent || "").toLowerCase();

        switch (statusFilter) {
          case "match":
            return isMatch;
          case "mismatch":
            // Mismatch should also include other statuses like geocode_error etc.
            return !isMatch;
          case "delivered":
            return lastEvent === "delivered";
          case "attempted":
            return lastEvent === "attempted";
          default:
            return true;
        }
      });
    }

    const q = globalQuery.trim().toLowerCase();
    if (!q) return base;

    const contains = (val?: any) =>
      String(val ?? "")
        .toLowerCase()
        .includes(q);

    return base.filter(
      (r) =>
        contains(r.barcode) ||
        contains(r.sequenceNo) ||       
        contains(r.lastevent) ||         
        contains(r.address) ||
        contains(r.lastGpsLocation) ||
        contains(r.expectedLocation) ||
        contains(r.status) ||
        contains(r.distanceKm) ||
        contains(r.mapsUrl)
    );
  }, [needAllRows, allRows, rows, statusFilter, globalQuery]);

  // This logic is now correct.
  // If needAllRows is true, total is client-side filtered length.
  // If needAllRows is false, total is API-side total.
  const effectiveTotal = needAllRows ? filteredRows.length : total;
  const effectiveTotalPages = Math.max(1, Math.ceil(effectiveTotal / limit));

  useEffect(() => {
    // This effect ensures if filters reduce total pages, we don't stay on an empty page
    if (page > effectiveTotalPages) setPage(effectiveTotalPages);
  }, [page, effectiveTotalPages]);

  const pagedRows: DriverReportRow[] = useMemo(() => {
    if (!needAllRows) return filteredRows; // Not filtering, so return the API-paginated rows
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit); // We are filtering, so slice the filtered data
  }, [needAllRows, filteredRows, page, limit]);

  const pageNumbers = useMemo(() => {
    const tp = effectiveTotalPages;
    const half = Math.floor(PAGE_WINDOW / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(tp, start + PAGE_WINDOW - 1);
    if (end - start + 1 < PAGE_WINDOW)
      start = Math.max(1, end - PAGE_WINDOW + 1);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, effectiveTotalPages]);

  const canPrev = page > 1;
  const canNext = page < effectiveTotalPages;

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!driverId) {
        setError("Please select a driver.");
        return;
      }
      setError(null);
      setQueried(true);
      setPage(1); // Reset page on new search
      setAllRows(null); // Force refetch
    },
    [driverId]
  );

  const handleExport = useCallback(async () => {
    if (!driverId) {
      setError("Cannot export: please select a driver.");
      return;
    }
    setError(null);
    try {
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

  const openMapOverlay = useCallback((row: DriverReportRow, rowKey: string) => {
    setSelectedRow(row);
    setMapSrc(toEmbedUrl(row));

    const card = cardRef.current;
    const rowEl = rowRefs.current[rowKey];
    if (card && rowEl) {
      const cardRect = card.getBoundingClientRect();
      const rowRect = rowEl.getBoundingClientRect();
      let desiredTop = rowRect.top - cardRect.top - 8;
      const maxTop = Math.max(
        PANEL_PADDING,
        card.clientHeight - PANEL_H - PANEL_PADDING
      );
      desiredTop = Math.min(Math.max(desiredTop, PANEL_PADDING), maxTop);
      setPanelTop(desiredTop);

      const absolutePanelTop = cardRect.top + desiredTop;
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;
      const outOfView =
        absolutePanelTop < viewportTop + 80 ||
        absolutePanelTop > viewportBottom - PANEL_H - 40;

      if (outOfView) {
        window.scrollTo({
          top: window.scrollY + absolutePanelTop - 80,
          behavior: "smooth",
        });
      }
    } else {
      setPanelTop(PANEL_PADDING);
    }

    setShowMap(true);
  }, []);

  const clearFilters = () => {
    setGlobalQuery("");
    setStatusFilter("all");
    setPage(1);
    setQueried(true); // Re-run search with "all"
  };

  const clearSelection = () => {
    setGlobalQuery("");
    setStatusFilter("all");
    setPage(1);
    setDriverId("");
    setRows([]);
    setAllRows(null);
    setTotal(0);
    setQueried(false); 
    setError(null);
    setShowMap(false);
    setShowProof(false);
  };

  return (
    <AdminLayout title="Overview">
      <form onSubmit={handleSearch} className="card p-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Select Driver</label>
            <select
              className="form-select"
              value={driverId}
              onChange={(e) => {
                setDriverId(e.target.value);
                setPage(1); // Reset page when driver changes
                setShowMap(false);
                setShowProof(false);
                setAllRows(null); // Force refetch
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
                setPage(1); // Reset page when date changes
                setShowMap(false);
                setShowProof(false);
                setAllRows(null); // Force refetch
              }}
            />
          </div>

          <div className="col-12 col-md-5 d-flex gap-2 justify-content-end">
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
                data-bs-auto-close="outside"
                type="button"
                aria-expanded="false"
                title="Filter & search"
              >
                <LuSlidersHorizontal />
              </button>

              <div
                className="dropdown-menu dropdown-menu-end p-2"
                style={{ minWidth: 280 }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPage(1); // Reset page on search
                    setQueried(true);
                  }}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                  />
                </form>

                <hr className="dropdown-divider" />

                <button
                  className={`dropdown-item ${
                    statusFilter === "all" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setPage(1);
                    setQueried(true);
                  }}
                >
                  All
                </button>
                <button
                  className={`dropdown-item ${
                    statusFilter === "match" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setStatusFilter("match");
                    setPage(1);
                    setQueried(true);
                  }}
                >
                  Match
                </button>
                <button
                  className={`dropdown-item ${
                    statusFilter === "mismatch" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setStatusFilter("mismatch");
                    setPage(1);
                    setQueried(true);
                  }}
                >
                  Mismatch
                </button>
                
                {/* CHANGE 3: Added new filter buttons for Delivered and Attempted */}
                <button
                  className={`dropdown-item ${
                    statusFilter === "delivered" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setStatusFilter("delivered");
                    setPage(1);
                    setQueried(true);
                  }}
                >
                  Delivered
                </button>
                <button
                  className={`dropdown-item ${
                    statusFilter === "attempted" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setStatusFilter("attempted");
                    setPage(1);
                    setQueried(true);
                  }}
                >
                  Attempted
                </button>

                <div className="d-grid mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearFilters}
                    title="Clear search & status"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>
        )}
      </form>

      <div ref={cardRef} className="card mt-3 position-relative">
        <button
          type="button"
          className="btn btn-sm btn-light position-absolute"
          style={{ top: -13, right: 0, padding: "1px 4px", lineHeight: 1 }}
          title="Clear selection"
          onClick={clearSelection}
          aria-label="Clear selection"
        >
          <LuX />
        </button>

        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0 custom-table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Seq No</th>
                <th>Last Event</th>
                <th>Address</th>
                <th>GPS Location</th>
                <th>Expected Location</th>
                <th>Distance (meter)</th>
                <th>Status</th>
                <th className="text-end">Google Maps Link</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-muted">
                    No data available.
                  </td>
                </tr>
              ) : (
                // This logic is now correct:
                // If needAllRows=true, render pagedRows (client-paginated)
                // If needAllRows=false, render rows (api-paginated)
                (needAllRows ? pagedRows : rows).map((r, i) => {
                  const isMatch = String(r.status || "")
                    .toLowerCase()
                    .startsWith("match");
                  const lastEventStatus = String(r.lastevent || "").toLowerCase();
                  const rowKey = String(r.barcode ?? `row-${i}`);

                  return (
                    <tr
                      key={`${r.barcode}-${i}`}
                      ref={(el) => {
                        rowRefs.current[rowKey] = el;
                      }}
                    >
                      <td>{r.barcode ?? ""}</td>
                      <td>{r.sequenceNo ?? "-"}</td>
                      
                      <td>
                        {r.lastevent ? (
                          <span
                            className={`status-badge ${
                              lastEventStatus === "delivered"
                                ? "status-delivered"
                                : lastEventStatus === "attempted"
                                ? "status-attempted"
                                : ""
                            }`}
                          >
                            {r.lastevent}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      
                      <td className="text-wrap" style={{ maxWidth: 280 }}>
                        {r.address ?? ""}
                      </td>
                      <td>{r.lastGpsLocation ?? ""}</td>
                      <td>{r.expectedLocation ?? ""}</td>
                      <td>
                        {r.distanceKm ? Number(r.distanceKm).toFixed(2) : "-"}m
                      </td>
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
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openMapOverlay(r, rowKey)}
                        >
                          View Map
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          limit={limit}
          setLimit={setLimit}
          page={page}
          setPage={setPage}
          canPrev={canPrev}
          canNext={canNext}
          pageNumbers={pageNumbers}
          totalPages={effectiveTotalPages}
        />

        {showMap && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.25)",
                zIndex: 5,
                borderRadius: "var(--radius)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: panelTop,
                transform: "translateX(-50%)",
                width: "calc(100% - 2rem)",
                maxWidth: 1180,
                background: "#fff",
                borderRadius: "var(--radius)",
                boxShadow: "0 10px 26px rgba(0,0,0,.25)",
                zIndex: 6,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  height: HEADER_H,
                  borderBottom: "1px solid #e9eef5",
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setShowMap(false);
                    setShowProof(false);
                  }}
                  className="btn btn-light"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 8,
                    borderRadius: 8,
                    padding: "6px 8px",
                    lineHeight: 1,
                  }}
                  title="Close"
                >
                  <LuX />
                </button>
              </div>

              <div style={{ width: "100%", height: MAP_HEIGHT }}>
                <iframe
                  src={mapSrc}
                  style={{ width: "100%", height: "100%", border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map"
                />
              </div>

              <div
                className="px-3 py-3"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 12,
                  borderTop: "1px solid #e9eef5",
                }}
              >
                <div className="text-start">
                  <div className="fw-bold mb-1">Driver info</div>
                  <ul className="mb-0" style={{ paddingLeft: 18 }}>
                    <li>Driver ID: {driverId || "-"}</li>
                    <li>Driver Name: {driverName || "-"}</li>
                  </ul>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setShowProof(true)}
                  >
                    Delivery proof
                  </button>
                </div>

                <div className="text-end">
                  <div className="fw-bold mb-1">Order info</div>
                  <div className="small text-muted">
                    <div>
                      <strong>Barcode:</strong> {selectedRow?.barcode || "—"}
                    </div>
                    <div className="mt-1">
                      <strong>Address:</strong> {selectedRow?.address || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {showProof && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.45)",
                    display: "grid",
                    placeItems: "center",
                    zIndex: 7,
                  }}
                >
                  <div
                    className="bg-white"
                    style={{
                      width: "min(520px, 92%)",
                      maxWidth: "calc(100% - 3rem)",
                      borderRadius: 14,
                      boxShadow: "0 10px 26px rgba(0,0,0,.25)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-between px-3 py-2"
                      style={{ borderBottom: "1px solid #e9eef5" }}
                    >
                      <h5 className="mb-0">Delivery proof</h5>
                      <button
                        className="btn btn-light"
                        onClick={() => setShowProof(false)}
                        aria-label="Close proof"
                        title="Close"
                      >
                        <LuX />
                      </button>
                    </div>

                    <div
                      className="p-3"
                      style={{ maxHeight: MAP_HEIGHT, overflow: "auto" }}
                    >
                      <img
                        src={
                          selectedRow?.proofImage ||
                          selectedRow?.proofUrl ||
                          selectedRow?.proof ||
                          "https://smartroutes.io/blogs/content/images/2024/04/Electronic-Proof-of-Delivery--ePOD-.png"
                        }
                        alt="Delivery proof"
                        style={{
                          width: "100%",
                          height: 250,
                          borderRadius: 12,
                          display: "block",
                        }}
                      />
                      <div className="mt-3 small text-muted">
                        <strong>GPS Location:</strong>{" "}
                        {selectedRow?.lastGpsLocation || "—"}
                      </div>
                    </div>

                    <div
                      className="px-3 py-2 d-flex justify-content-end"
                      style={{ borderTop: "1px solid #e9eef5" }}
                    >
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setShowProof(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

const PaginationBar: React.FC<{
  limit: number;
  setLimit: (n: number) => void;
  page: number;
  setPage: (n: number) => void;
  canPrev: boolean;
  canNext: boolean;
  pageNumbers: number[];
  totalPages: number;
}> = ({
  limit,
  setLimit,
  page,
  setPage,
  canPrev,
  canNext,
  pageNumbers,
  totalPages,
}) => (
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
        onClick={() => canPrev && setPage(page - 1)}
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
        onClick={() => canNext && setPage(page + 1)}
      >
        Next ›
      </button>
    </div>
  </div>
);

export default Dashboard;
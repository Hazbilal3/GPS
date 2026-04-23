import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import "../App.css";
import axios from "axios";
import { port } from "../port.interface";

export interface Route {
  id?: number;
  routeNumber: string;
  description: string;
  zipCode: string[];
  ratePerStop: number | null;
  ratePerStopCompanyVehicle: number | null;
  baseRate: number | null;
  baseRateCompanyVehicle: number | null;
  zone: string;
  status: string;
}

type RateField =
  | "ratePerStop"
  | "ratePerStopCompanyVehicle"
  | "baseRate"
  | "baseRateCompanyVehicle";

// ── Edit Modal ───────────────────────────────────────────────────────────────
interface EditModalProps {
  route: Route;
  token: string;
  onClose: () => void;
  onSaved: (updated: Route) => void;
}

const EditModal: React.FC<EditModalProps> = ({ route, token, onClose, onSaved }) => {
  const [form, setForm] = useState({
    ratePerStop: route.ratePerStop != null ? String(route.ratePerStop) : "",
    ratePerStopCompanyVehicle:
      route.ratePerStopCompanyVehicle != null
        ? String(route.ratePerStopCompanyVehicle)
        : "",
    baseRate: route.baseRate != null ? String(route.baseRate) : "",
    baseRateCompanyVehicle:
      route.baseRateCompanyVehicle != null
        ? String(route.baseRateCompanyVehicle)
        : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const handleChange = (field: RateField, val: string) => {
    // Allow digits, one dot, empty
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setForm((prev) => ({ ...prev, [field]: val }));
    }
  };

  const handleSave = async () => {
    const patch: Record<string, number> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== "") {
        const num = parseFloat(v);
        if (isNaN(num) || num < 0) {
          setError(`Invalid value for ${k}`);
          return;
        }
        patch[k] = num;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await axios.patch(`${port}/uploads/route/${route.id}`, patch, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSaved({
        ...route,
        ratePerStop: form.ratePerStop !== "" ? parseFloat(form.ratePerStop) : null,
        ratePerStopCompanyVehicle:
          form.ratePerStopCompanyVehicle !== ""
            ? parseFloat(form.ratePerStopCompanyVehicle)
            : null,
        baseRate: form.baseRate !== "" ? parseFloat(form.baseRate) : null,
        baseRateCompanyVehicle:
          form.baseRateCompanyVehicle !== ""
            ? parseFloat(form.baseRateCompanyVehicle)
            : null,
      });
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: RateField; label: string }[] = [
    { key: "ratePerStop", label: "Rate per Stop" },
    { key: "ratePerStopCompanyVehicle", label: "Rate per Stop (Company Vehicle)" },
    { key: "baseRate", label: "Base Rate" },
    { key: "baseRateCompanyVehicle", label: "Base Rate (Company Vehicle)" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--card-bg, #1e2535)",
          borderRadius: 12,
          padding: "28px 32px",
          width: 420,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          color: "var(--text-color, #e0e6f0)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Edit Rates</div>
            <div style={{ fontSize: 12, color: "#8896a5", marginTop: 2 }}>
              Route {route.routeNumber} — {route.description}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8896a5",
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(({ key, label }, i) => (
            <div key={key}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8896a5",
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8896a5",
                    fontSize: 14,
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>
                <input
                  ref={i === 0 ? firstRef : undefined}
                  type="text"
                  inputMode="decimal"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 26px",
                    background: "var(--input-bg, #151c2c)",
                    border: "1px solid var(--border-color, #2a3347)",
                    borderRadius: 7,
                    color: "var(--text-color, #e0e6f0)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    appearance: "none",
                    MozAppearance: "textfield",
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#4f9cf9";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color, #2a3347)";
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div
            style={{
              color: "#e74c3c",
              fontSize: 13,
              marginTop: 10,
              background: "rgba(231,76,60,0.1)",
              padding: "6px 10px",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div
          style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "8px 18px",
              borderRadius: 7,
              border: "1px solid var(--border-color, #2a3347)",
              background: "transparent",
              color: "var(--text-color, #e0e6f0)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 22px",
              borderRadius: 7,
              border: "none",
              background: saving ? "#3d6b9e" : "#4f9cf9",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};


// ── Add Route Modal ────────────────────────────────────────────────────────────
const AddRouteModal = ({ token, onClose, onCreated }) => {
  const [form, setForm] = React.useState({
    routeNumber: "",
    description: "",
    ratePerStop: "",
    ratePerStopCompanyVehicle: "",
    baseRate: "",
    baseRateCompanyVehicle: "",
    zone: "",
    status: "Active",
    zipCode: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fields = [
    { key: "routeNumber", label: "Route Number", placeholder: "e.g. 222" },
    { key: "description", label: "Description", placeholder: "e.g. PAWCUTUCK" },
    { key: "ratePerStop", label: "Rate Per Stop ($)", placeholder: "2.35" },
    { key: "ratePerStopCompanyVehicle", label: "Rate Per Stop - Co. Vehicle ($)", placeholder: "2.00" },
    { key: "baseRate", label: "Base Rate ($)", placeholder: "Optional" },
    { key: "baseRateCompanyVehicle", label: "Base Rate - Co. Vehicle ($)", placeholder: "Optional" },
    { key: "zone", label: "Zone", placeholder: "zone A" },
    { key: "zipCode", label: "ZIP Codes", placeholder: "06379, 06380 (comma-separated)" },
  ];

  const handleSave = async () => {
    if (!form.description.trim() || !form.ratePerStop.trim()) {
      setError("Description and Rate per Stop are required.");
      return;
    }
    const num = parseFloat(form.ratePerStop);
    if (isNaN(num) || num < 0) { setError("Invalid rate per stop."); return; }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        routeNumber: form.routeNumber || undefined,
        description: form.description,
        ratePerStop: parseFloat(form.ratePerStop),
        ratePerStopCompanyVehicle: form.ratePerStopCompanyVehicle ? parseFloat(form.ratePerStopCompanyVehicle) : undefined,
        baseRate: form.baseRate ? parseFloat(form.baseRate) : undefined,
        baseRateCompanyVehicle: form.baseRateCompanyVehicle ? parseFloat(form.baseRateCompanyVehicle) : undefined,
        zone: form.zone || undefined,
        status: form.status,
        zipCode: form.zipCode ? form.zipCode.split(",").map(z => z.trim()).filter(Boolean) : [],
      };
      const res = await axios.post(`${port}/uploads/route`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onCreated(res.data);
      onClose();
    } catch {
      setError("Failed to add route.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--card-bg,#1e2535)", borderRadius: 12,
        padding: "28px 32px", width: "100%", maxWidth: 480, maxHeight: "90vh",
        overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        color: "var(--text-color,#e0e6f0)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Add New Route</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8896a5", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8896a5", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                {label}
              </label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => {
                  const val = e.target.value;
                  if (['ratePerStop','ratePerStopCompanyVehicle','baseRate','baseRateCompanyVehicle'].includes(key)) {
                    if (val === "" || /^\d*\.?\d*$/.test(val)) setForm(p => ({ ...p, [key]: val }));
                  } else {
                    setForm(p => ({ ...p, [key]: val }));
                  }
                }}
                placeholder={placeholder}
                style={{
                  width: "100%", padding: "9px 12px",
                  background: "var(--input-bg,#151c2c)",
                  border: "1px solid var(--border-color,#2a3347)", borderRadius: 7,
                  color: "var(--text-color,#e0e6f0)", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8896a5", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
              style={{
                width: "100%", padding: "9px 12px",
                background: "var(--input-bg,#151c2c)",
                border: "1px solid var(--border-color,#2a3347)", borderRadius: 7,
                color: "var(--text-color,#e0e6f0)", fontSize: 14, outline: "none",
              }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ color: "#e74c3c", fontSize: 13, marginTop: 10, background: "rgba(231,76,60,0.1)", padding: "6px 10px", borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid var(--border-color,#2a3347)", background: "transparent", color: "var(--text-color,#e0e6f0)", cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 22px", borderRadius: 7, border: "none", background: saving ? "#3d6b9e" : "#4f9cf9", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
            {saving ? "Adding…" : "Add Route"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────────
interface DeleteModalProps {
  route: Route;
  token: string;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ route, token, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await axios.delete(`${port}/uploads/route/${route.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleted(route.id!);
      onClose();
    } catch {
      setError("Failed to delete route. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--card-bg, #1e2535)",
          borderRadius: 12,
          padding: "28px 32px",
          width: 420,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          color: "var(--text-color, #e0e6f0)",
          textAlign: "center"
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, borderRadius: "50%", background: "rgba(231,76,60,0.1)", color: "#e74c3c", marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 18, margin: "0 0 8px 0" }}>Delete Route</h3>
          <p style={{ color: "#8896a5", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to delete route <strong>{route.routeNumber || route.description}</strong>?<br/>This action cannot be undone.
          </p>
        </div>

        {error && (
          <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 16, background: "rgba(231,76,60,0.1)", padding: "6px 10px", borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              padding: "9px 24px",
              borderRadius: 7,
              border: "1px solid var(--border-color, #2a3347)",
              background: "transparent",
              color: "var(--text-color, #e0e6f0)",
              cursor: deleting ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "9px 24px",
              borderRadius: 7,
              border: "none",
              background: "#e74c3c",
              color: "#fff",
              cursor: deleting ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const RoutesPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<Route | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [addingRoute, setAddingRoute] = useState(false);

  async function loadRoutes() {
    try {
      setLoading(true);
      const res = await axios.get<Route[]>(`${port}/uploads/customroute`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Route[] = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.data ?? [];
      setRoutes(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaved = (updated: Route) => {
    setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast("✅ Rates updated successfully");
  };

  const handleRouteCreated = (newRoute: Route) => {
    setRoutes((prev) => [newRoute, ...prev]);
    showToast("✅ Route added successfully");
  };

  const handleDeleted = (id: number) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    showToast("🗑️ Route deleted successfully");
  };

  const fmtRate = (v: number | null) =>
    v != null ? `$${v}` : <span style={{ color: "#4a5568" }}>–</span>;

  return (
    <AdminLayout title="Routes">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 9999,
            background: "#27ae60",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            fontSize: 14,
          }}
        >
          {toast}
        </div>
      )}

      {/* Edit modal */}
      {editingRoute && (
        <EditModal
          route={editingRoute}
          token={token}
          onClose={() => setEditingRoute(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete modal */}
      {deletingRoute && (
        <DeleteModal
          route={deletingRoute}
          token={token}
          onClose={() => setDeletingRoute(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* Add Route button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={() => setAddingRoute(true)}
          style={{
            background: "#4f9cf9",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 20px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Route
        </button>
      </div>

      {/* Add Route Modal */}
      {addingRoute && (
        <AddRouteModal
          token={token}
          onClose={() => setAddingRoute(false)}
          onCreated={handleRouteCreated}
        />
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="card p-3">Loading…</div>
      ) : (
        <div className="table-responsive card p-3">
          <table className="table table-borderless align-middle mb-0 custom-table text-center">
            <thead>
              <tr>
                <th>#</th>
                <th>Route No.</th>
                <th>Description</th>
                <th>Zip Code</th>
                <th>Rate / Stop</th>
                <th>Rate / Stop (Co. Vehicle)</th>
                <th>Base Rate</th>
                <th>Base Rate (Co. Vehicle)</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {routes.length > 0 ? (
                routes.map((r, idx) => (
                  <tr key={r.id ?? idx}>
                    <td>{idx + 1}</td>
                    <td>{r.routeNumber ?? "–"}</td>
                    <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                      {r.description ?? "–"}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {r.zipCode
                        ? r.zipCode
                            .map((z) => `0${z.toString().replace(/^0+/, "")}`)
                            .join(", ")
                        : "–"}
                    </td>
                    <td>{fmtRate(r.ratePerStop)}</td>
                    <td>{fmtRate(r.ratePerStopCompanyVehicle)}</td>
                    <td>{fmtRate(r.baseRate)}</td>
                    <td>{fmtRate(r.baseRateCompanyVehicle)}</td>
                    <td>
                      <span className="badge-soft badge-soft-blue">
                        {r.zone ?? "–"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          r.status?.toLowerCase() === "active"
                            ? "badge-soft badge-soft-green"
                            : "badge-soft badge-soft-red"
                        }
                      >
                        {r.status ?? "–"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => setEditingRoute(r)}
                          title="Edit rates"
                          style={{
                            background: "none",
                            border: "1px solid var(--border-color, #2a3347)",
                            borderRadius: 6,
                            padding: "5px 8px",
                            cursor: "pointer",
                            color: "var(--text-color, #8896a5)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "border-color 0.15s, color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = "#4f9cf9";
                            (e.currentTarget as HTMLElement).style.color = "#4f9cf9";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "var(--border-color, #2a3347)";
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--text-color, #8896a5)";
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingRoute(r)}
                          title="Delete route"
                          style={{
                            background: "none",
                            border: "1px solid var(--border-color, #2a3347)",
                            borderRadius: 6,
                            padding: "5px 8px",
                            cursor: "pointer",
                            color: "#e74c3c",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(231,76,60,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "none";
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-4 text-muted">
                    No routes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default RoutesPage;

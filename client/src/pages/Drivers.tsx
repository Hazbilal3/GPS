import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import {
  deleteDriverByDriverId,
  listDrivers,
  type Driver,
} from "../services/adminApi";
import { LuTrash2 } from "react-icons/lu";
import "../App.css";

const DriversPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [target, setTarget] = useState<Driver | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listDrivers(token);
      setDrivers(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDelete = (drv: Driver) => {
    setTarget(drv);
    setActionError(null);
    setConfirmOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeDelete = () => {
    setConfirmOpen(false);
    setDeleting(false);
    setTarget(null);
    setActionError(null);
    document.body.style.overflow = "";
  };

  const confirmDelete = async () => {
    if (!target || !token) return;

    const identifier = (target.driverId ?? target.id) as
      | string
      | number
      | undefined;
    if (
      identifier === undefined ||
      String(identifier).trim() === "" ||
      String(identifier).toLowerCase() === "undefined"
    ) {
      setActionError("Missing driver identifier.");
      return;
    }

    setDeleting(true);
    setActionError(null);
    try {
      await deleteDriverByDriverId(identifier, token);
      closeDelete();
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Drivers">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="card p-3">Loading...</div>
      ) : (
        <div className="table-responsive card p-3">
          <table className="table table-borderless align-middle mb-0 custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Driver ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th className="text-end" style={{ width: 56 }}></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, idx) => (
                <tr key={String(d.id ?? d.driverId ?? idx)}>
                  <td>{idx + 1}</td>
                  <td>{d.driverId != null ? String(d.driverId) : "-"}</td>
                  <td>{d.fullName || "-"}</td>
                  <td>{d.email || "-"}</td>
                  <td>{d.phoneNumber || "-"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => openDelete(d)}
                      aria-label="Delete driver"
                      title="Delete"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <LuTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">
                    No drivers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm modal (reuses your upload modal style) */}
      {confirmOpen && target && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeDelete}
        >
          <div
            className="modal-content modal-danger"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-icon"
              aria-hidden="true"
              style={{
                background: "#ef4444",
                boxShadow: "0 6px 14px rgba(239,68,68,.35)",
              }}
            >
              !
            </div>
            <h3>Confirm delete</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>
                {target.fullName || `Driver #${target.driverId ?? target.id}`}
              </strong>
              ?
            </p>

            {actionError && (
              <div className="upload-status" style={{ marginTop: 8 }}>
                {actionError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                marginTop: 10,
              }}
            >
              <button
                className="close-btn"
                onClick={closeDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="close-btn close-btn--danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DriversPage;

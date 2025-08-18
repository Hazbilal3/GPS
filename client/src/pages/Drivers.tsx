import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import {
  listDrivers,
  createDriver,
  updateDriver,
  type Driver,
} from "../services/adminApi";

const DriversPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

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

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(d: Driver) {
    setEditing(d);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const payload: any = {
      driverId: Number(fd.get("driverId") || 0),
      fullName: fd.get("fullName")?.toString().trim() || "",
      email: fd.get("email")?.toString().trim() || "",
      phoneNumber: fd.get("phoneNumber")?.toString().trim() || "",
    };

    // password only when creating a new driver
    if (!editing) {
      payload.password = fd.get("password")?.toString().trim() || "";
    }

    // ✅ Validation
    if (!payload.driverId || isNaN(payload.driverId)) {
      return alert("Driver ID is required and must be numeric.");
    }
    if (!payload.fullName) {
      return alert("Full Name is required.");
    }
    if (!payload.phoneNumber || isNaN(Number(payload.phoneNumber))) {
      return alert("Phone number is required and must be numeric.");
    }
    if (!payload.email || !/\S+@\S+\.\S+/.test(payload.email)) {
      return alert("Valid email is required.");
    }
    if (!editing) {
      if (
        !payload.password ||
        !/^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(payload.password)
      ) {
        return alert(
          "Password must be at least 8 characters and include a number and a special character."
        );
      }
    }

    try {
      if (editing?.id) {
        await updateDriver(editing.id, payload, token);
      } else {
        await createDriver(payload, token);
      }
      setShowForm(false);
      form.reset();
      await load();
    } catch (e: any) {
      alert(e?.message || "Save failed");
    }
  }

  return (
    <AdminLayout title="Drivers">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div />
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Driver
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="card p-3">Loading...</div>
      ) : (
        <div className="table-responsive card p-3">
          <table className="table table-borderless align-middle mb-0 custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Driver ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={String(d.id ?? d.driverId)}>
                  <td>{String(d.id ?? "-")}</td>
                  <td>{String(d.driverId ?? "-")}</td>
                  <td>{d.fullName || "-"}</td>
                  <td>{d.email || "-"}</td>
                  <td>{d.phoneNumber || "-"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openEdit(d)}
                    >
                      Edit
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? "Edit Driver" : "Add Driver"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowForm(false)}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Driver ID</label>
                      <input
                        name="driverId"
                        type="number"
                        className="form-control"
                        defaultValue={String(editing?.driverId ?? "")}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        name="fullName"
                        type="text"
                        className="form-control"
                        defaultValue={String(editing?.fullName ?? "")}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        name="phoneNumber"
                        type="text"
                        className="form-control"
                        defaultValue={String(editing?.phoneNumber ?? "")}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        name="email"
                        type="email"
                        className="form-control"
                        defaultValue={String(editing?.email ?? "")}
                      />
                    </div>
                    {!editing && (
                      <div className="col-md-12">
                        <label className="form-label">Password</label>
                        <input
                          name="password"
                          type="password"
                          className="form-control"
                          placeholder="Enter password"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Save Changes" : "Create Driver"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DriversPage;

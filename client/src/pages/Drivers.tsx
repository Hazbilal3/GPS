import React, { useEffect, useState } from "react";
import { listDrivers, createDriver, updateDriver, type Driver } from "../services/adminApi";

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  const token = localStorage.getItem("token") ?? "";

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
      fullName: fd.get("fullName") || "",
      email: fd.get("email") || "",
      phoneNumber: fd.get("phoneNumber") || "",
    };
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
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Drivers</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Driver
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="table-responsive card-surface p-3">
          <table className="table table-dark table-striped align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Driver ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th></th>
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
                      className="btn btn-sm btn-outline-primary me-2"
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
                      <label className="form-label">Email</label>
                      <input
                        name="email"
                        type="email"
                        className="form-control"
                        defaultValue={String(editing?.email ?? "")}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        name="fullName"
                        type="text"
                        className="form-control"
                        defaultValue={String((editing as any)?.fullName ?? "")}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        name="phoneNumber"
                        type="text"
                        className="form-control"
                        defaultValue={String(
                          (editing as any)?.phoneNumber ?? ""
                        )}
                      />
                    </div>
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
    </div>
  );
};

export default DriversPage;

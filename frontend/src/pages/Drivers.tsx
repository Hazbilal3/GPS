import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import {
  deleteDriverByDriverId,
  listDrivers,
  createDriver,
  updateDriverByDriverId,
  type Driver,
} from "../services/adminApi";
import { LuTrash2, LuPencil, LuPlus } from "react-icons/lu";
import "../App.css";

const digitsOnly = (s: string) => s.replace(/\D/g, "");
const isAllDigits = (s: string) => /^\d+$/.test(s);
const handleDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End",
  ];
  if (e.ctrlKey || e.metaKey) return;
  if (allowed.includes(e.key)) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
};

type ModalMode = "create" | "edit";

type FormState = {
  driverId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
};

const emptyForm: FormState = {
  driverId: "",
  fullName: "",
  phoneNumber: "",
  email: "",
  password: "",
};

const DriversPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [target, setTarget] = useState<Driver | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [editingOriginal, setEditingOriginal] = useState<Driver | null>(null);

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
      !identifier ||
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

  const validateForm = (m: ModalMode) => {
    const errs: Record<string, string> = {};
    const { driverId, fullName, phoneNumber, email, password } = form;

    if (!driverId.trim()) errs.driverId = "Driver ID is required.";
    else if (!isAllDigits(driverId))
      errs.driverId = "Driver ID must contain digits only.";

    if (!fullName.trim()) errs.fullName = "Full name is required.";

    if (!phoneNumber.trim()) errs.phoneNumber = "Phone number is required.";
    else if (!isAllDigits(phoneNumber))
      errs.phoneNumber = "Phone number must contain digits only.";

    if (!email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email format.";

    if (m === "create") {
      if (!password.trim()) errs.password = "Password is required.";
      else if (!/^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password))
        errs.password = "At least 8 chars, 1 number & 1 special char.";
    } else {
      if (password && !/^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password))
        errs.password = "At least 8 chars, 1 number & 1 special char.";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setMode("create");
    setForm(emptyForm);
    setFormErrors({});
    setShowPwd(false);
    setEditingOriginal(null);
    setFormOpen(true);
    document.body.style.overflow = "hidden";
  };

  const openEdit = (drv: Driver) => {
    setMode("edit");
    setForm({
      driverId: drv.driverId != null ? String(drv.driverId) : "",
      fullName: drv.fullName ?? "",
      phoneNumber: drv.phoneNumber != null ? String(drv.phoneNumber) : "",
      email: drv.email ?? "",
      password: "",
    });
    setFormErrors({});
    setShowPwd(false);
    setEditingOriginal(drv);
    setFormOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeForm = () => {
    setFormOpen(false);
    setSubmitting(false);
    setFormErrors({});
    setEditingOriginal(null);
    setShowPwd(false);
    document.body.style.overflow = "";
  };

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(mode)) return;

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload = {
          email: form.email.trim(),
          password: form.password.trim(),
          userRole: 2,
          driverId: Number(form.driverId),
          fullName: form.fullName.trim(),
          phoneNumber: String(form.phoneNumber).trim(),
        };
        await createDriver(payload, token);
      } else if (mode === "edit" && editingOriginal) {
        const diff: Record<string, any> = { userRole: 2 };
        const old = editingOriginal;

        const changed = (
          k: keyof FormState,
          newVal: string | number | undefined,
          oldVal: any
        ) => String(newVal ?? "").trim() !== String(oldVal ?? "").trim();

        if (changed("email", form.email, old.email))
          diff.email = form.email.trim();
        if (changed("fullName", form.fullName, old.fullName))
          diff.fullName = form.fullName.trim();
        if (changed("phoneNumber", form.phoneNumber, old.phoneNumber))
          diff.phoneNumber = String(form.phoneNumber).trim();
        if (changed("driverId", form.driverId, old.driverId))
          diff.driverId = Number(form.driverId);
        if (form.password.trim()) diff.password = form.password.trim();

        const keys = Object.keys(diff);
        if (keys.length === 1 && keys[0] === "userRole") {
          closeForm();
          return;
        }

        const pathId = old.driverId ?? old.id;
        await updateDriverByDriverId(String(pathId), diff, token);
      }

      closeForm();
      await load();
    } catch (err: any) {
      setFormErrors({ form: err?.message || "Operation failed" });
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Drivers">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div />
        <button
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={openCreate}
        >
          <LuPlus /> Add Driver
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
                <th>#</th>
                <th>Driver ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th className="text-end" style={{ width: 110 }}></th>
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
                    <div className="d-inline-flex align-items-center gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openEdit(d)}
                        aria-label="Edit driver"
                        title="Edit"
                      >
                        <LuPencil />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => openDelete(d)}
                        aria-label="Delete driver"
                        title="Delete"
                      >
                        <LuTrash2 />
                      </button>
                    </div>
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

      {formOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeForm}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2">
              {mode === "create" ? "Add Driver" : "Edit Driver"}
            </h3>
            <p className="text-muted" style={{ marginTop: -6 }}>
              {mode === "create"
                ? "Create a new driver account"
                : "Update driver information"}
            </p>

            <form onSubmit={onSubmitForm} className="text-start">
              <label className="form-label text-black">Driver ID</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={20}
                className={`form-control ${
                  formErrors.driverId ? "is-invalid" : ""
                }`}
                placeholder="Enter Driver ID"
                value={form.driverId}
                onKeyDown={handleDigitKeyDown}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    driverId: digitsOnly(e.target.value),
                  }))
                }
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = (
                    e.clipboardData || (window as any).clipboardData
                  ).getData("text");
                  setForm((f) => ({ ...f, driverId: digitsOnly(pasted) }));
                }}
              />
              {formErrors.driverId && (
                <div className="text-danger small">{formErrors.driverId}</div>
              )}

              <label className="form-label text-black mt-2">Full Name</label>
              <input
                type="text"
                className={`form-control ${
                  formErrors.fullName ? "is-invalid" : ""
                }`}
                placeholder="Enter Full Name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
              />
              {formErrors.fullName && (
                <div className="text-danger small">{formErrors.fullName}</div>
              )}

              <label className="form-label mt-2 text-black">Phone Number</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={20}
                className={`form-control ${
                  formErrors.phoneNumber ? "is-invalid" : ""
                }`}
                placeholder="Enter Phone Number"
                value={form.phoneNumber}
                onKeyDown={handleDigitKeyDown}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    phoneNumber: digitsOnly(e.target.value),
                  }))
                }
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = (
                    e.clipboardData || (window as any).clipboardData
                  ).getData("text");
                  setForm((f) => ({ ...f, phoneNumber: digitsOnly(pasted) }));
                }}
              />
              {formErrors.phoneNumber && (
                <div className="text-danger small">
                  {formErrors.phoneNumber}
                </div>
              )}

              <label className="form-label mt-2 text-black">Email</label>
              <input
                type="email"
                className={`form-control ${
                  formErrors.email ? "is-invalid" : ""
                }`}
                placeholder="Enter Email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              {formErrors.email && (
                <div className="text-danger small">{formErrors.email}</div>
              )}

              <label className="form-label mt-2 text-black">
                Password{" "}
                {mode === "edit" && (
                  <span className="text-muted">(optional)</span>
                )}
              </label>
              <div className="position-relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className={`form-control ${
                    formErrors.password ? "is-invalid" : ""
                  }`}
                  placeholder={
                    mode === "edit"
                      ? "Leave blank to keep unchanged"
                      : "Enter Password"
                  }
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="btn btn-link eye-btn"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <i className="fa-solid fa-eye"></i>
                  ) : (
                    <i className="fa-solid fa-eye-slash"></i>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <div className="text-danger small">{formErrors.password}</div>
              )}

              {formErrors.form && (
                <div className="alert alert-danger py-2 mt-2">
                  {formErrors.form}
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="close-btn"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="close-btn close-btn--primary"
                  disabled={submitting}
                >
                  {submitting
                    ? mode === "create"
                      ? "Creating…"
                      : "Updating…"
                    : mode === "create"
                    ? "Create"
                    : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DriversPage;

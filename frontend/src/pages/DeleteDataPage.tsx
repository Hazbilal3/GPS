import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import { listDrivers } from "../services/adminApi";
import "../assets/components-css/FileUploadForm.css";
import { port as PORT_BASE } from "../port.interface";

function getRoleName(): "admin" | "driver" | "" {
  const raw = (
    localStorage.getItem("userRole") ??
    localStorage.getItem("role") ??
    ""
  )
    .toString()
    .toLowerCase()
    .trim();
  if (raw === "1" || raw === "admin") return "admin";
  if (raw === "2" || raw === "driver") return "driver";
  return "";
}

type DriverOption = { id: number | string; label: string };
type DropState = "idle" | "loading";

const BASE_URL = PORT_BASE;

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const DeleteDataPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const role = getRoleName();
  const isAdmin = role === "admin";

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [date, setDate] = useState<string>(toYMD(new Date()));
  const [rightName, setRightName] = useState(isAdmin ? "Admin" : "Driver");

  const [state, setState] = useState<DropState>("idle");
  const [status, setStatus] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalKind, setModalKind] = useState<"success" | "notfound" | "error">(
    "success"
  );
  const prevOverflow = useRef<string>("");

  useEffect(() => {
    if (showModal) {
      prevOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow.current;
    }
  }, [showModal]);

  useEffect(() => {
    (async () => {
      const cachedName =
        localStorage.getItem("fullName") ||
        localStorage.getItem("driverName") ||
        localStorage.getItem("firstname") ||
        localStorage.getItem("firstName") ||
        (isAdmin ? "Admin" : "Driver");
      setRightName(cachedName);

      if (isAdmin && token) {
        try {
          const list = await listDrivers(token);
          const opts =
            (list || []).map((d: any) => ({
              id: String(d.driverId ?? d.id ?? ""),
              label: d.fullName
                ? `${d.fullName} (${d.driverId ?? d.id ?? "-"})`
                : String(d.driverId ?? d.id ?? "-"),
            })) || [];
          setDrivers(opts);
          if (!selectedDriverId && opts.length > 0) {
            setSelectedDriverId(String(opts[0].id));
          }
        } catch {
          /* ignore */
        }
      } else if (!isAdmin) {
        const myId = String(localStorage.getItem("driverId") ?? "");
        setSelectedDriverId(myId);
      }
    })();
  }, [isAdmin, token]);

  const onDelete = async () => {
    if (!token) {
      setStatus("❌ Not authorized. Please log in first.");
      return;
    }
    const effectiveDriverId = isAdmin
      ? selectedDriverId
      : String(localStorage.getItem("driverId") ?? "");

    if (!effectiveDriverId) {
      setStatus("❌ Please select a driver.");
      return;
    }
    if (!date) {
      setStatus("❌ Please choose a date.");
      return;
    }

    setState("loading");
    setStatus("Deleting…");
    try {
      const url = new URL("/uploads", BASE_URL);
      url.searchParams.set("driverId", effectiveDriverId);
      url.searchParams.set("date", date);

      const res = await fetch(url.toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok || res.status === 204) {
        setModalKind("success");
        setShowModal(true);
        setStatus(null);
        return;
      }

      let body: any = null;
      try {
        body = await res.json();
      } catch {}
      const msg = body?.message
        ? Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message
        : "";

      if (res.status === 404 || /not\s*found/i.test(msg)) {
        setModalKind("notfound");
        setShowModal(true);
        setStatus(null);
      } else {
        setModalKind("error");
        setShowModal(true);
        setStatus(null);
      }
    } catch (e: any) {
      setModalKind("error");
      setShowModal(true);
      setStatus(null);
    } finally {
      setState("idle");
    }
  };

  return (
    <AdminLayout
      title="Delete Data"
      variant={isAdmin ? "admin" : "driver"}
      rightNameOverride={rightName}
    >
      {isAdmin && (
        <div className="upload-narrow card p-3 mb-3">
          <label className="form-label">Select Driver</label>
          <select
            className="form-select upload-select"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
          >
            {drivers.length === 0 ? (
              <option value="">Loading drivers…</option>
            ) : (
              drivers.map((d) => (
                <option key={String(d.id)} value={String(d.id)}>
                  {d.label}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      <div className="upload-narrow card p-3">
        <label className="form-label">Select Date</label>
        <input
          type="date"
          className="form-control upload-select"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button
          className="submit-btn mt-3"
          type="button"
          onClick={onDelete}
          disabled={state === "loading" || !selectedDriverId || !date}
        >
          {state === "loading" ? "Deleting…" : "Delete"}
        </button>

        {status && <div className="upload-status">{status}</div>}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div
            className={`modal-content ${
              modalKind === "success"
                ? "modal-success"
                : modalKind === "notfound"
                ? "modal-danger"
                : "modal-danger"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon" aria-hidden="true">
              {modalKind === "success" ? "✓" : "!"}
            </div>
            <h3>
              {modalKind === "success"
                ? "Deleted successfully"
                : modalKind === "notfound"
                ? "Data not found"
                : "Delete failed"}
            </h3>
            <p className="mb-0">
              {modalKind === "success"
                ? "The file for the selected driver and date has been removed."
                : modalKind === "notfound"
                ? "No file existed for the selected driver and date."
                : "Please try again or check your parameters."}
            </p>
            <div className="mt-3">
              <button
                className="close-btn close-btn--primary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DeleteDataPage;

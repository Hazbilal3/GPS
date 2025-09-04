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

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

type DriverOption = { id: number | string; label: string };

const BASE_URL = PORT_BASE;
type DropState = "idle" | "dragover" | "loading";

const FileUploadForm: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const role = getRoleName();
  const isAdmin = role === "admin";

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [rightName, setRightName] = useState(isAdmin ? "Admin" : "Driver");

  const [date, setDate] = useState<string>(toYMD(new Date()));

  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<DropState>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = showModal ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
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
      }
    })();
  }, [isAdmin, token]);

  const chooseFile = () => inputRef.current?.click();

  const isCsvOrExcel = (f: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const ext = f.name.split(".").pop()?.toLowerCase();
    return (
      validTypes.includes(f.type) || ["csv", "xlsx", "xls"].includes(ext || "")
    );
  };

  const onFileChange = (f: File | null) => {
    if (!f) return;
    if (!isCsvOrExcel(f)) {
      setStatus("❌ Invalid file format. Please upload a .csv or Excel file.");
      setFile(null);
      return;
    }
    setFile(f);
    setStatus(null);
    setState("idle");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("idle");
    onFileChange(e.dataTransfer.files?.[0] || null);
  };

  const onUpload = async () => {
    if (!file || state === "loading") return;
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
      setStatus("❌ Please select a date.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("driverId", effectiveDriverId);
    formData.append("date", date);

    setStatus("Uploading file, please wait a moment.");
    setState("loading");
    try {
      const res = await fetch(`${BASE_URL}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        let msg = "❌ Upload failed.";
        try {
          const j = await res.json();
          if (j?.message)
            msg =
              "❌ " +
              (Array.isArray(j.message) ? j.message.join(", ") : j.message);
        } catch {}
        setStatus(msg);
        setState("idle");
        return;
      }

      setShowModal(true);
      setStatus(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setStatus(`❌ ${err?.message || "Network error."}`);
    } finally {
      setState("idle");
    }
  };

  return (
    <AdminLayout
      title="Upload"
      variant={isAdmin ? "admin" : "driver"}
      rightNameOverride={rightName}
    >
      {/* Admin-only driver selector with date directly below it */}
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

          {/* Date (below driver field) */}
          <label className="form-label mt-2">Select Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      {/* Driver view: show only the date selector above upload to keep layout consistent */}
      {!isAdmin && (
        <div className="upload-narrow card p-3 mb-3">
          <label className="form-label">Select Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      {/* Upload card (unchanged visually) */}
      <div className="upload-wrapper">
        <div
          className={`drop-area ${state === "dragover" ? "is-drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setState("dragover");
          }}
          onDragLeave={() => setState("idle")}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onClick={chooseFile}
        >
          <img
            className="upload-icon"
            src="https://img.icons8.com/color/48/google-sheets.png"
            alt=""
          />
          <div className="upload-title">Select a CSV/Excel file to import</div>
          <div className="upload-subtitle">or drag and drop it here</div>

          <input
            ref={inputRef}
            className="d-none"
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          />

          {file && (
            <div className="file-preview">
              <span className="file-name-preview">📄 {file.name}</span>
              <span
                className="remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                  setStatus(null);
                }}
                role="button"
                aria-label="Remove file"
                title="Remove file"
              >
                ×
              </span>
            </div>
          )}
        </div>

        <button
          className="submit-btn"
          type="button"
          onClick={onUpload}
          disabled={
            state === "loading" ||
            !file ||
            (isAdmin && !selectedDriverId) ||
            !date
          }
        >
          {state === "loading" ? "Uploading…" : "Upload"}
        </button>

        {status && <div className="upload-status">{status}</div>}

        {showModal && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal-content modal-success"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon" aria-hidden="true">
                ✓
              </div>
              <h3>Upload Successful</h3>
              <p>Your file has been uploaded and will be processed.</p>
              <button
                className="close-btn close-btn--primary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FileUploadForm;

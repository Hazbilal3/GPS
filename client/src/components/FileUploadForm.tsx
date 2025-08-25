import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import { listDrivers } from "../services/adminApi";
import "../assets/components-css/FileUploadForm.css";
import { port } from "../port.interface";

type DropState = "idle" | "dragover" | "loading";

const BASE_URL = port;

const FileUploadForm: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [driverName, setDriverName] = useState("Driver");

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
    const cached =
      localStorage.getItem("fullName") ||
      localStorage.getItem("driverName") ||
      "";
    if (cached) setDriverName(cached);

    (async () => {
      try {
        if (!token) return;
        const list = await listDrivers(token);
        if (!Array.isArray(list) || list.length === 0) return;

        const storedId =
          Number(localStorage.getItem("driverId")) ||
          Number(localStorage.getItem("userId"));

        const match =
          list.find(
            (d) => Number(d.id) === storedId || Number(d.driverId) === storedId
          ) || list[0];

        const name = match?.fullName || match?.id?.toString() || "Driver";
        setDriverName(name);
      } catch {
        /* ignore */
      }
    })();
  }, [token]);

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

    const driverId = localStorage.getItem("driverId") ?? "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("driverId", driverId);

    setStatus("Uploading...");
    setState("loading");
    try {
      const res = await fetch(`${BASE_URL}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // IMPORTANT: don't set Content-Type for FormData
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
        } catch {
          /* ignore */
        }
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
    <AdminLayout title="Upload" variant="driver" rightNameOverride={driverName}>
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
          disabled={!file || state === "loading"}
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

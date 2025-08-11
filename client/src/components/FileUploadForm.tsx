import React, { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import "../assets/components-css/FileUploadForm.css";

const COLUMNS = [
  "Barcode",
  "Address",
  "GPS Location",
  "Expected Location",
  "Distance (km)",
  "Status",
  "Google Maps Link",
];

const BASE_URL = "http://localhost:3000/"; 

const FileUploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [response, setResponse] = useState<any[]>([]);

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile?: File) => {
    if (!selectedFile) return;
    if (isCsvOrExcel(selectedFile)) {
      setFile(selectedFile);
      setStatus(null);
    } else {
      setStatus("❌ Invalid file format. Please upload a .csv or Excel file.");
      setFile(null);
    }
  };

  const isCsvOrExcel = (f: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const ext = f.name.split(".").pop()?.toLowerCase();
    return validTypes.includes(f.type) || ["csv", "xlsx", "xls"].includes(ext || "");
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select a file.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("❌ Not authorized. Please log in first.");
      return;
    }

    const formData = new FormData();
    // IMPORTANT: field name must be 'file' to match FileInterceptor('file')
    formData.append("file", file);

    setStatus("Uploading...");
    try {
      const res = await fetch(`${BASE_URL}upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // DO NOT set Content-Type for FormData
        },
        body: formData,
      });

      if (!res.ok) {
        // try to read backend message if available
        let msg = "❌ Upload failed.";
        try {
          const j = await res.json();
          if (j?.message) msg = `❌ ${Array.isArray(j.message) ? j.message.join(", ") : j.message}`;
        } catch { /* ignore */ }
        setStatus(msg);
        return;
      }

      // backend returns { message, count }, but per your ask we don't show raw response.
      // We show a success modal, clear input, and optionally keep response table hidden.
      setShowModal(true);
      setStatus(null);
      setResponse([]); // keep empty unless you later want to render processed rows
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setStatus(`❌ ${err?.message || "Network error."}`);
    }
  };

  return (
    <div className="page">
      <div className="page-inner">
        <form className="upload-wrapper card-surface p-4" onSubmit={handleSubmit}>
          {/* Drop Area */}
          <div
            className="drop-area"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <img
              src="https://img.icons8.com/color/48/google-sheets.png"
              alt="excel"
              className="upload-icon"
            />
            <p className="upload-title">Select a CSV/Excel file to import</p>
            <p className="upload-subtitle">or drag and drop it here</p>
            <input
              type="file"
              ref={inputRef}
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              hidden
            />
            {file && (
              <div className="file-preview">
                <p className="file-name-preview">📄 {file.name}</p>
                <span className="remove-file" onClick={handleRemoveFile}>
                  ×
                </span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button type="submit" className="submit-btn">
            Upload
          </button>

          {/* Status */}
          {status && <div className="upload-status">{status}</div>}

          {/* Success Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>✅ Upload Successful</h3>
                <p>Your file has been uploaded and will be processed.</p>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Table (kept but hidden unless you populate `response`) */}
        {Array.isArray(response) && response.length > 0 && (
          <div className="response-table-wrapper">
            <h4>📋 Uploaded Records</h4>
            <div className="table-scroll-container">
              <table className="styled-table">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {response.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {COLUMNS.map((col, colIndex) => {
                        const value = row[col] ?? "";
                        if (col === "Google Maps Link" && value) {
                          return (
                            <td key={colIndex}>
                              <a href={value} target="_blank" rel="noopener noreferrer">
                                View Map
                              </a>
                            </td>
                          );
                        }
                        return <td key={colIndex}>{String(value)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadForm;

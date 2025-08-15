import React, {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
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

const BASE_URL = "http://localhost:3006/";

const FileUploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [response, setResponse] = useState<any[]>([]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = showModal ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal]);

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
    return (
      validTypes.includes(f.type) || ["csv", "xlsx", "xls"].includes(ext || "")
    );
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
    const driverId = localStorage.getItem("driverId");
    if (!token) {
      setStatus(":x: Not authorized. Please log in first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("driverId", driverId);
    setStatus("Uploading...");
    try {
      const res = await fetch(`${BASE_URL}uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // DO NOT set Content-Type for FormData
        },
        body: formData,
      });
      if (!res.ok) {
        let msg = ":x: Upload failed.";
        try {
          const j = await res.json();
          if (j?.message)
            msg = `:x: ${
              Array.isArray(j.message) ? j.message.join(", ") : j.message
            }`;
        } catch {
          /* ignore */
        }
        setStatus(msg);
        return;
      }
      setShowModal(true);
      setStatus(null);
      setResponse([]);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setStatus(`:x: ${err?.message || "Network error."}`);
    }
  };

  return (
    <div className="page">
      <div className="page-inner">
        <form className="upload-wrapper  p-4" onSubmit={handleSubmit}>
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

          <button type="submit" className="submit-btn">
            Upload
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
        </form>

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
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
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

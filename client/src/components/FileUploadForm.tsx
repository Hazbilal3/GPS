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

const FileUploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [response, setResponse] = useState<any[]>([]);

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (isExcelFile(selectedFile)) {
      setFile(selectedFile);
      setStatus(null);
    } else {
      setStatus("❌ Invalid file format. Please upload .csv or Excel files.");
      setFile(null);
    }
  };

  const isExcelFile = (file: File) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const extension = file.name.split(".").pop()?.toLowerCase();
    return (
      validTypes.includes(file.type) ||
      ["csv", "xlsx", "xls"].includes(extension || "")
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

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading...");
    const port = "http://localhost:3000/";

    try {
      const res = await fetch(port + "upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setResponse(result);
        setShowModal(true);
        setStatus(null);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        setStatus("❌ Upload failed.");
      }
    } catch (error: any) {
      setStatus("❌ " + error.message || "Network error.");
    }
  };

  return (
    <>

      <form className="upload-wrapper">
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
        <button type="submit" className="submit-btn" onClick={handleSubmit}>
          Upload
        </button>

        {/* Status */}
        {status && <div className="upload-status">{status}</div>}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>✅ Upload Successful</h3>
              <p>Your file has been uploaded successfully.</p>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Table */}
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
                      // Make Google Maps Link clickable
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

    </>
  );  
};

export default FileUploadForm;

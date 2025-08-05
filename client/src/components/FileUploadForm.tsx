import React, {
  useState,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { FiChevronDown } from "react-icons/fi";
import "../assets/components-css/FileUploadForm.css";

const mockDrivers = [
  { id: 1, name: "Driver A" },
  { id: 2, name: "Driver B" },
  { id: 3, name: "Driver C" },
];

const FileUploadForm: React.FC = () => {
  const [driverId, setDriverId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

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
    if (!file || !driverId) {
      setStatus("Please select both a driver and a file.");
      return;
    }

    const formData = new FormData();
    formData.append("driverId", driverId);
    formData.append("file", file);

    setStatus("Uploading...");

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setShowModal(true);
        setStatus(null);
        setFile(null);
        setDriverId("");
        if (inputRef.current) inputRef.current.value = "";
      } else {
        setStatus("❌ Upload failed.");
      }
    } catch (error) {
      setStatus("❌ Network error.");
    }
  };

  return (
    <form className="upload-wrapper" onSubmit={handleSubmit}>
      <div className="dropdown-wrapper top-dropdown">
        <div className="dropdown-container">
          <div
            className="dropdown-trigger"
            onClick={toggleDropdown}
            tabIndex={0}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          >
            <span>
              {driverId
                ? mockDrivers.find((d) => d.id.toString() === driverId)?.name
                : "Choose a driver"}
            </span>
            <span className={`dropdown-icon ${dropdownOpen ? "rotate" : ""}`}>
              <FiChevronDown size={20} />
            </span>
          </div>

          {dropdownOpen && (
            <ul className="custom-dropdown-menu" role="listbox">
              {mockDrivers.map((driver) => (
                <li
                  key={driver.id}
                  onClick={() => {
                    setDriverId(driver.id.toString());
                    setDropdownOpen(false);
                  }}
                >
                  {driver.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
        <p className="upload-title">Select a CSV file to import</p>
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

      <button
        type="submit"
        className="submit-btn"
        disabled={!file || !driverId}
      >
        Upload
      </button>

      {status && <div className="upload-status">{status}</div>}

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
  );
};

export default FileUploadForm;

import React, { useEffect, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import {
  listAirtableDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from "../services/airtableApi";
import DriverDetailPanel from "./DriverDetailPanel";
import DriverFormPanel from "./DriverFormPanel";
import "../assets/components-css/DriversDirectory.css";
import pp from "../assets/pics/pp.svg";
import { ToastProvider, useToast } from "../components/ToastManager";
import {
LuPlus
} from "react-icons/lu";



export interface Driver {
  id?: number;
  ["Full Name"]: string;
  ["First Name"]: string;
  ["Last Name"]: string;
  Company?: string;
  Status: string;
  ["Phone Number"]?: string;
  Email?: string;
  ["OFID Number"]?: number | string;
  ["Salary Type"]?: string;
  Schedule?: string[];
  ["Day of the Week"]?: string;
  ["Driver Available Today?"]?: string;
  ["Base Rate"]?: number;
  ["Rate per Stop"]?: number;
  ["Fixed Rate Per Stop"]?: number;
}

const DriversDirectoryInner: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  async function loadDrivers() {
    try {
      setLoading(true);
      const data = await listAirtableDrivers();
      setDrivers(data);
      if (data.length > 0) setSelectedDriver(data[0]);
    } catch (e: any) {
      setError(e?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleAddDriver = async (driverData: any) => {
    try {
      await createDriver(driverData);
      await loadDrivers();
      setIsAdding(false);
      showToast("Driver added successfully", "success");
    } catch (e: any) {
      showToast("Failed to create driver", "error");
    }
  };

  const handleUpdateDriver = async (id: number, driverData: Partial<Driver>) => {
    try {
      await updateDriver(id, driverData);
      await loadDrivers();
      showToast("Driver updated successfully", "success");
    } catch (e: any) {
      showToast("Failed to update driver", "error");
    }
  };

  const handleDeleteDriver = async (id: number) => {
    try {
      await deleteDriver(id);
      await loadDrivers();
      setSelectedDriver(null);
      showToast("Driver deleted successfully", "success");
    } catch (e: any) {
      showToast("Failed to delete driver", "error");
    }
  };

  const filteredDrivers = drivers.filter((d) =>
    d["Full Name"]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Drivers">
      <div className="drivers-container">
        {/* Sidebar */}
        <div className="drivers-sidebar">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn btn-primary ms-2"
              onClick={() => setIsAdding(true)}
            >
              <LuPlus/>
            </button>
          </div>

          {loading ? (
            <p className="text-center mt-3">Loading...</p>
          ) : error ? (
            <p className="text-danger text-center">{error}</p>
          ) : (
            <ul className="drivers-list">
              {filteredDrivers.map((d, idx) => (
                <li
                  key={idx}
                  className={`driver-item ${
                    selectedDriver?.["Full Name"] === d["Full Name"]
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedDriver(d);
                    setIsAdding(false);
                  }}
                >
                  <div className="driver-avatar">
                    <img className="driver-avatar" src={pp} alt="pp" />
                  </div>
                  <div className="driver-info">
                    <div className="driver-name">{d["Full Name"]}</div>
                    <div className="badge-row">
                      <span
                        className={`badge-pill ${
                          d.Status === "Active"
                            ? "badge-green"
                            : "badge-red"
                        }`}
                      >
                        {d.Status}
                      </span>
                      {d["Salary Type"] && (
                        <span className="badge-pill badge-blue">
                          {d["Salary Type"]}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side Panel */}
        <div className="drivers-details">
          {isAdding ? (
            <DriverFormPanel
              onCancel={() => setIsAdding(false)}
              onSubmit={handleAddDriver}
            />
          ) : selectedDriver ? (
            <DriverDetailPanel
              driver={selectedDriver}
              reloadDrivers={loadDrivers}
              onUpdate={handleUpdateDriver}
              onDelete={handleDeleteDriver}
            />
          ) : (
            <div className="card p-4 text-center">
              <p>Select a driver to view details</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap your page with ToastProvider
const DriversDirectory = () => (
  <ToastProvider>
    <DriversDirectoryInner />
  </ToastProvider>
);

export default DriversDirectory
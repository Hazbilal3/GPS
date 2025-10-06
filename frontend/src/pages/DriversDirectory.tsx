import React, { useEffect, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import { listAirtableDrivers } from "../services/airtableApi";
import DriverDetailPanel from "./DriverDetailPanel";
import "../assets/components-css/DriversDirectory.css";
// import {
//     LuUser,
//     LuSearch
// } from "react-icons/lu";
import pp from "../assets/pics/pp.svg"

export interface Driver {
  id?: string | number;
  ["Full Name"]: string;
  ["First Name"]: string;
  ["Last Name"]: string;
  Company?: string;
  Status: string;
  ["Payroll"]?: string[];
  ["Stops"]?: string[];
  ["Phone Number"]?: string;
  Email?: string;
  ["Last Trip Date"]?: string[];
  ["OFID Number"]?: number;
  ["Salary Type"]?: string;
  Schedule?: string[];
  ["Day of the Week"]?: string;
  ["Driver Available Today?"]?: string;
}

const DriversDirectory: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const filteredDrivers = drivers.filter((d) =>
    d["Full Name"]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Drivers From Airtable">
      <div className="drivers-container">
        {/* Sidebar */}
        <div className="drivers-sidebar">
          <input
            type="text"
            className="form-control search-input mb-3"
            placeholder=" Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
                  onClick={() => setSelectedDriver(d)}
                >
                  <div className="driver-avatar"><img className="driver-avatar" src={pp} alt="pp" /></div>
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

        {/* Right Details Panel */}
        <div className="drivers-details">
          {selectedDriver ? (
            <DriverDetailPanel driver={selectedDriver} />
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

export default DriversDirectory;

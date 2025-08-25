import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import {
  listDrivers,
  type Driver,
} from "../services/adminApi";

const DriversPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminLayout title="Drivers">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div />
        {/* Removed Add Driver button */}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="card p-3">Loading...</div>
      ) : (
        <div className="table-responsive card p-3">
          <table className="table table-borderless align-middle mb-0 custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Driver ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                {/* Removed Actions column */}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={String(d.id ?? d.driverId)}>
                  <td>{String(d.id ?? "-")}</td>
                  <td>{String(d.driverId ?? "-")}</td>
                  <td>{d.fullName || "-"}</td>
                  <td>{d.email || "-"}</td>
                  <td>{d.phoneNumber || "-"}</td>
                  {/* Removed Edit button */}
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">
                    No drivers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default DriversPage;

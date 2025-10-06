import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import { listRoutes } from "../services/adminApi";
import "../App.css";

// Define the Route type here
export interface Route {
  id?: string | number;
  ["Route Number"]: string;
  Description: string;
  ["Base Rate"]: number;
  ["Base Rate (Company Vehicle)"]: number;
  ["Rate per Stop"]: number;
  ["Rate per Stop (Company Vehicle)"]: number;
  Zone: string;
  Status: string;
  Route?: string;
}

const RoutesPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRoutes() {
    try {
      setLoading(true);
      const data = (await listRoutes(token)) as Route[];
      setRoutes(data);
      setRoutes(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  return (
    <AdminLayout title="Routes">
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="card p-3">Loading...</div>
      ) : (
        <div className="table-responsive card p-3">
          <table className="table table-borderless align-middle mb-0 custom-table text-center">
            <thead>
              <tr>
                <th>#</th>
                <th>Route Number</th>
                <th>Description</th>
                <th>Base Rate</th>
                <th>Base Rate (Company Vehicle)</th>
                <th>Rate per Stop</th>
                <th>Rate per Stop (Company Vehicle)</th>
                <th>Zone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r, idx) => (
                <tr key={r.id ?? idx}>
                  <td>{idx + 1}</td>
                  <td>{r["Route Number"]}</td>
                  <td>{r.Description}</td>
                  <td>{r["Base Rate"] ? `$${r["Base Rate"]}` : "-"}</td>
                  <td>
                    {r["Base Rate (Company Vehicle)"]
                      ? `$${r["Base Rate (Company Vehicle)"]}`
                      : "-"}
                  </td>
                  <td>{r["Rate per Stop"] ? `$${r["Rate per Stop"]}` : "-"}</td>
                  <td>
                    {r["Rate per Stop (Company Vehicle)"]
                      ? `$${r["Rate per Stop (Company Vehicle)"]}`
                      : "-"}
                  </td>
                  <td>
                    <span className="badge-soft badge-soft-blue">{r.Zone}</span>
                  </td>
                  <td>
                    <span
                      className={
                        r.Status === "Active"
                          ? "badge-soft badge-soft-green"
                          : "badge-soft badge-soft-red"
                      }
                    >
                      {r.Status}
                    </span>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center">
                    No routes found
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

export default RoutesPage;

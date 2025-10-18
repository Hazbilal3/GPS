import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shareable/AdminLayout";
import "../App.css";
import axios from "axios";
import { port } from "../port.interface";

export interface Route {
  id?: number;
  routeNumber: string;
  description: string;
  zipCode: string[];
  ratePerStop: number | null;
  ratePerStopCompanyVehicle: number | null;
  baseRate: number | null;
  baseRateCompanyVehicle: number | null;
  zone: string;
  status: string;
}

const RoutesPage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRoutes() {
    try {
      setLoading(true);

      const res = await axios.get<Route[]>(`${port}/uploads/customroute`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Route[] = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.data ?? [];

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
                <th>Zip Code</th>
                <th>Rate per Stop</th>
                <th>Rate per Stop (Company Vehicle)</th>
                <th>Base Rate</th>
                <th>Base Rate (Company Vehicle)</th>
                <th>Zone</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {routes.length > 0 ? (
                routes.map((r, idx) => (
                  <tr key={r.id ?? idx}>
                    <td>{idx + 1}</td>
                    <td>{r.routeNumber ?? "-"}</td>
                    <td>{r.description ?? "-"}</td>
                    <td>
                      {r.zipCode
                        ? r.zipCode
                            .map((z) => `0${z.toString().replace(/^0+/, "")}`)
                            .join(", ")
                        : "-"}
                    </td>

                    <td>{r.ratePerStop ? `$${r.ratePerStop}` : "-"}</td>
                    <td>
                      {r.ratePerStopCompanyVehicle
                        ? `$${r.ratePerStopCompanyVehicle}`
                        : "-"}
                    </td>
                    <td>{r.baseRate ? `$${r.baseRate}` : "-"}</td>
                    <td>
                      {r.baseRateCompanyVehicle
                        ? `$${r.baseRateCompanyVehicle}`
                        : "-"}
                    </td>
                    <td>
                      <span className="badge-soft badge-soft-blue">
                        {r.zone ?? "-"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          r.status?.toLowerCase() === "active"
                            ? "badge-soft badge-soft-green"
                            : "badge-soft badge-soft-red"
                        }
                      >
                        {r.status ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-muted">
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

import React, { useState, useEffect } from "react";
import { port } from "../port.interface";
import AdminLayout from "../shareable/AdminLayout";
import { LuX, LuChevronRight, LuChevronDown } from "react-icons/lu";
import "../assets/components-css/Payroll.css";

type ZipBreakdown = {
  zip: string;
  stops: number;
  rate: number;
  amount: number;
};

type Driver = {
  driverName: string;
  totalStops: number;
  subtotal: number;
  zipBreakdown: ZipBreakdown[];
};

type PayrollData = {
  weekNumber: number;
  payPeriod: string;
  totalStops: number;
  subtotal: number;
  drivers: Driver[];
};

const PayrollPage: React.FC = () => {
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        const res = await fetch(`${port}/uploads/payroll`);
        if (!res.ok) {
          throw new Error("Failed to fetch payroll data");
        }
        const data: PayrollData[] = await res.json();
        const sortedData = data.sort((a, b) => b.weekNumber - a.weekNumber);
        setPayrollData(sortedData);
      } catch (err: any) {
        setError(err?.message || "Failed to load payroll data");
      } finally {
        setLoading(false);
      }
    };
    fetchPayrollData();
  }, []);

  const toggleWeek = (weekNumber: string) => {
    setExpandedWeek((prev) => (prev === weekNumber ? null : weekNumber));
  };

  const handleShowDetails = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const closeModal = () => {
    setSelectedDriver(null);
  };

  return (
    <AdminLayout title="Payroll">
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="card p-3">Loading...</div>
      ) : (
        <div className="table-responsive card p-3">
          <table className="table table-borderless align-middle mb-0 custom-table text-center">
            <thead>
              <tr>
                <th>Week Number</th>
                <th>Pay Period</th>
                <th>Driver</th>
                <th>Total Stops</th>
                <th>Subtotal</th>
                <th>Show Details</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map((weekData) => {
                const isExpanded = expandedWeek === String(weekData.weekNumber);
                return (
                  <React.Fragment key={weekData.weekNumber}>
                    <tr
                      className="week-summary-row"
                      onClick={() => toggleWeek(String(weekData.weekNumber))}
                    >
                      {/* Column 1: Week Number and Toggle Icon */}
                      <td>
                        {isExpanded ? <LuChevronDown /> : <LuChevronRight />}
                        Week {weekData.weekNumber}
                      </td>
                      {/* Column 2: Pay Period (now empty) */}
                      <td></td>
                      {/* Column 3: Driver (empty placeholder) */}
                      <td></td>
                      {/* Column 4: Total Stops (always visible) */}
                      <td><span style={{color: "#aaa", fontWeight:"200"}}>sum: </span>{weekData.totalStops}</td>
                      {/* Column 5: Subtotal (always visible) */}
                      <td><span style={{color: "#aaa",fontWeight:"200"}}>sum: </span>${weekData.subtotal.toFixed(2)}</td>
                      {/* Column 6: Show Details (empty placeholder) */}
                      <td></td>
                    </tr>

                    {/* Driver rows are rendered only when expanded */}
                    {isExpanded &&
                      weekData.drivers.map((driver, idx) => (
                        <tr key={idx}>
                          <td>{weekData.weekNumber}</td>
                          <td>{weekData.payPeriod}</td>
                          <td>{driver.driverName}</td>
                          <td>{driver.totalStops}</td>
                          <td>${driver.subtotal.toFixed(2)}</td>
                          <td>
                            <button
                              className="btn btn-outline-pay-primary"
                              onClick={() => handleShowDetails(driver)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Driver Details */}
      {selectedDriver && (
        <div className="modal-overlay-pay">
          <div className="modal-content-pay">
            <button
              onClick={closeModal}
              className="btn btn-light"
            >
              <LuX />
            </button>

            <h6 className="mb-3" style={{ color: "#3b82f6" }}>
              <span className="de" style={{ color: "#000" }}>
                Driver:{" "}
              </span>{" "}
              {selectedDriver.driverName}
            </h6>
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>Zip</th>
                  <th>Stops</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedDriver.zipBreakdown.map((zip, idx) => (
                  <tr key={idx}>
                    <td>{zip.zip}</td>
                    <td>{zip.stops}</td>
                    <td>${zip.rate.toFixed(2)}</td>
                    <td>${zip.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PayrollPage;
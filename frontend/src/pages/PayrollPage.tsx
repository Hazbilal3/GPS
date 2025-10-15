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
              {payrollData.map((weekData) => (
                <React.Fragment key={weekData.weekNumber}>
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "left",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onClick={() => toggleWeek(String(weekData.weekNumber))}
                    >
                      {expandedWeek === String(weekData.weekNumber) ? (
                        <LuChevronDown />
                      ) : (
                        <LuChevronRight />
                      )}
                      Week {weekData.weekNumber}
                    </td>
                  </tr>
                  {expandedWeek === String(weekData.weekNumber) && (
                    <>
                      {weekData.drivers.map((driver, idx) => (
                        <tr key={idx}>
                          <td>{weekData.weekNumber}</td>
                          <td>{weekData.payPeriod}</td>
                          <td>{driver.driverName}</td>
                          <td>{driver.totalStops}</td>
                          <td>${driver.subtotal}</td>
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
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Driver Details */}
      {selectedDriver && (
        <div
          className="modal-overlay-pay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content-pay"
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "70%",
              maxWidth: "600px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <button
              onClick={closeModal}
              className="btn btn-light"
              style={{ position: "absolute", top: "10px", right: "10px" }}
            >
              <LuX />
            </button>

            <h6 className="mb-3" style={{ color: "black" }}>
              <span className="de" style={{ color: "#aaa" }}>
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
                    <td>${zip.rate}</td>
                    <td>${zip.amount}</td>
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

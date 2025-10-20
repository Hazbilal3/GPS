import React, { useState, useEffect } from "react";
import { port } from "../port.interface";
import AdminLayout from "../shareable/AdminLayout";
import { LuX, LuChevronRight, LuChevronDown } from "react-icons/lu";
import "../assets/components-css/Payroll.css";
import DriverFilterDropdown from "../shareable/DriverFilterDropdown";

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

  const [allDrivers, setAllDrivers] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

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

  useEffect(() => {
    if (payrollData.length > 0) {
      const driverSet = new Set<string>();
      payrollData.forEach((week) => {
        week.drivers.forEach((driver) => {
          driverSet.add(driver.driverName);
        });
      });
      setAllDrivers(Array.from(driverSet).sort());
    }
  }, [payrollData]);

  const toggleWeek = (weekNumber: string) => {
    setExpandedWeek((prev) => (prev === weekNumber ? null : weekNumber));
  };

  const handleShowDetails = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const closeModal = () => {
    setSelectedDriver(null);
  };

  const filteredPayrollData = payrollData
    .map((weekData) => {
      const driversToShow = weekData.drivers.filter((driver) =>
        selectedDrivers.length === 0
          ? true
          : selectedDrivers.includes(driver.driverName)
      );

      const newTotalStops = driversToShow.reduce(
        (acc, driver) => acc + driver.totalStops,
        0
      );
      const newSubtotal = driversToShow.reduce(
        (acc, driver) => acc + driver.subtotal,
        0
      );

      return {
        ...weekData,
        drivers: driversToShow,
        totalStops: newTotalStops,
        subtotal: newSubtotal,
      };
    })
    .filter((weekData) => weekData.drivers.length > 0);

  return (
    <AdminLayout title="Payroll">
      <div className="payroll-filter-bar">
        <DriverFilterDropdown
          drivers={allDrivers}
          selectedDrivers={selectedDrivers}
          onChange={setSelectedDrivers}
          title="Driver"
        />
      </div>
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
              {filteredPayrollData.length > 0 ? (
                filteredPayrollData.map((weekData) => {
                  const isExpanded =
                    expandedWeek === String(weekData.weekNumber);
                  return (
                    <React.Fragment key={weekData.weekNumber}>
                      <tr
                        className="week-summary-row"
                        onClick={() => toggleWeek(String(weekData.weekNumber))}
                      >
                        <td>
                          {isExpanded ? <LuChevronDown /> : <LuChevronRight />}
                          Week {weekData.weekNumber}
                        </td>
                        <td></td>
                        <td></td>
                        <td>
                          <span style={{ color: "#aaa", fontWeight: "200" }}>
                            sum:{" "}
                          </span>
                          {weekData.totalStops}
                        </td>
                        <td>
                          <span style={{ color: "#aaa", fontWeight: "200" }}>
                            sum:{" "}
                          </span>
                          ${weekData.subtotal.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>

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
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    {payrollData.length > 0
                      ? "No matching payroll data found."
                      : "No payroll data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedDriver && (
        <div className="modal-overlay-pay">
          <div className="modal-content-pay">
            <button onClick={closeModal} className="btn btn-light">
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

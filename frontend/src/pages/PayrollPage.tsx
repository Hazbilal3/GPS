import React, { useState, useEffect } from "react";
import { port } from "../port.interface";
import AdminLayout from "../shareable/AdminLayout";
import {
  LuX,
  LuChevronRight,
  LuChevronDown,
  LuCheck,
  LuPencil,
  LuList, 
} from "react-icons/lu";
import "../assets/components-css/Payroll.css";
import DriverFilterDropdown from "../shareable/DriverFilterDropdown";
import { listAirtableDriverNames } from "../services/airtableApi";


type ZipBreakdown = {
  zip: string;
  stops: number;
  rate: number;
  amount: number;
};

type Driver = {
  driverId: number; 
  driverName: string;
  totalStops: number;
  subtotal: number;
  totalDeduction: number;
  netPay: number;
  zipBreakdown: ZipBreakdown[];
};

type PayrollData = {
  weekNumber: number;
  payPeriod: string;
  totalStops: number;
  subtotal: number;
  totalDeductions: number;
  netPay: number;
  drivers: Driver[];
};

type DriverPayrollRecord = {
  weekNumber: number;
  payPeriod: string;
  totalStops: number;
  subtotal: number;
  totalDeduction: number;
  netPay: number;
  zipBreakdown: ZipBreakdown[];
};

function getRoleName(): "admin" | "driver" | "" {
  const raw = (
    localStorage.getItem("userRole") ??
    localStorage.getItem("role") ??
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  if (raw === "1" || raw === "admin") return "admin";
  if (raw === "2" || raw === "driver") return "driver";
  return "";
}

const PayrollPage: React.FC = () => {
  const role = getRoleName();
  const isAdmin = role === "admin";
  const [rightName, setRightName] = useState(isAdmin ? "Admin" : "Driver");

  useEffect(() => {
    const cachedName =
      localStorage.getItem("fullName") ||
      localStorage.getItem("driverName") ||
      localStorage.getItem("firstname") ||
      localStorage.getItem("firstName") ||
      (isAdmin ? "Admin" : "Driver");
    setRightName(cachedName);
  }, [isAdmin]);

  const driverId = localStorage.getItem("driverId") ?? "";
  const driverName =
    localStorage.getItem("fullName") ||
    localStorage.getItem("driverName") ||
    "Driver";

  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [allDrivers, setAllDrivers] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  const [editingDeduction, setEditingDeduction] = useState<{
    driverId: number;
    weekNumber: number;
  } | null>(null);
  const [currentDeductionValue, setCurrentDeductionValue] = useState<
    number | string
  >("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPayrollData = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = isAdmin
          ? `${port}/uploads/payroll`
          : `${port}/uploads/payroll/${driverId}`;

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.message || "Failed to fetch payroll data");
        }

        const rawData = await res.json();
        
        let data: PayrollData[] = [];

        if (isAdmin) {
          data = Array.isArray(rawData) ? rawData : [];
        } else {
          const driverRecords: DriverPayrollRecord[] = Array.isArray(rawData)
            ? rawData
            : [];
          
          data = driverRecords.map((record) => {
            const driver: Driver = {
              driverId: Number(driverId), 
              driverName: driverName, 
              totalStops: record.totalStops,
              subtotal: record.subtotal,
              totalDeduction: record.totalDeduction,
              netPay: record.netPay,
              zipBreakdown: record.zipBreakdown || [],
            };

            return {
              weekNumber: record.weekNumber,
              payPeriod: record.payPeriod || "",
              totalStops: record.totalStops,
              subtotal: record.subtotal,
              totalDeductions: record.totalDeduction,
              netPay: record.netPay,
              drivers: [driver], 
            };
          });
        }
        
        const sortedData = data.sort((a, b) => b.weekNumber - a.weekNumber);
        setPayrollData(sortedData);
        
      } catch (err: any) {
        setError(err?.message || "Failed to load payroll data");
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, [isAdmin, driverId, driverName]); 

  // useEffect(() => {
  //   if (payrollData.length > 0 && isAdmin) {
  //     const driverSet = new Set<string>();
  //     payrollData.forEach((week) => {
  //       week.drivers.forEach((driver) => driverSet.add(driver.driverName));
  //     });
  //     setAllDrivers(Array.from(driverSet).sort());
  //   }
  // }, [payrollData, isAdmin]);
  // /  UPDATED: Always load Airtable driver names for the dropdown
useEffect(() => {
  const fetchDrivers = async () => {
    if (!isAdmin) return;
    const names = await listAirtableDriverNames();
    setAllDrivers(names);
  };
  fetchDrivers();
}, [isAdmin])

  const toggleWeek = (weekNumber: string) => {
    setExpandedWeek((prev) => (prev === weekNumber ? null : weekNumber));
    setEditingDeduction(null); 
  };

  const handleShowDetails = (driver: Driver) => setSelectedDriver(driver);
  const closeModal = () => setSelectedDriver(null);


  const handleEditDeduction = (
    driverId: number,
    weekNumber: number,
    currentAmount: number,
  ) => {
    setEditingDeduction({ driverId, weekNumber });
    setCurrentDeductionValue(currentAmount);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingDeduction(null);
    setCurrentDeductionValue("");
    setEditError(null);
  };

  const handleSaveDeduction = async () => {
    if (!editingDeduction || isSaving) return;

    const { driverId, weekNumber } = editingDeduction;
    const totalDeduction = Number(currentDeductionValue);

    if (isNaN(totalDeduction) || totalDeduction < 0) {
      setEditError("Invalid deduction amount.");
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`${port}/uploads/payroll/deduction`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          driverId,         
          weekNumber,       
          totalDeduction, 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save deduction");
      }

      const updatedPayrollRecord = await res.json(); 

      
      setPayrollData((prevData) => {
        return prevData.map((week) => {
          if (week.weekNumber !== weekNumber) return week;

          let newWeekTotalDeductions = 0;
          let newWeekNetPay = 0;

          const newDrivers = week.drivers.map((driver) => {
            let newDriver = driver;
            if (driver.driverId === driverId) {
              
              newDriver = {
                ...driver,
                totalDeduction: updatedPayrollRecord.totalDeduction,
                netPay: updatedPayrollRecord.netPay,
              };
            }
            
            newWeekTotalDeductions += newDriver.totalDeduction;
            newWeekNetPay += newDriver.netPay;
            return newDriver;
          });
          
          
          const newWeekSubtotal = newDrivers.reduce((sum, d) => sum + d.subtotal, 0);
          const newWeekTotalStops = newDrivers.reduce((sum, d) => sum + d.totalStops, 0);


          return {
            ...week,
            drivers: newDrivers,
            totalStops: newWeekTotalStops,
            subtotal: newWeekSubtotal,
            totalDeductions: newWeekTotalDeductions,
            netPay: newWeekNetPay,
          };
        });
      });

      setEditingDeduction(null); 
      
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  


const filteredPayrollData = payrollData
  .map((weekData) => {
    const driversToShow = isAdmin
      ? weekData.drivers.filter((driver) =>
          selectedDrivers.length
            ? selectedDrivers.some((selected) =>
                driver.driverName
                  .toLowerCase()
                  .includes(selected.toLowerCase())
              )
            : true
        )
      : weekData.drivers;

    const newTotalStops = driversToShow.reduce(
      (acc, driver) => acc + driver.totalStops,
      0
    );
    const newSubtotal = driversToShow.reduce(
      (acc, driver) => acc + driver.subtotal,
      0
    );
    const newTotalDeductions = driversToShow.reduce(
      (acc, driver) => acc + driver.totalDeduction,
      0
    );
    const newNetPay = driversToShow.reduce(
      (acc, driver) => acc + driver.netPay,
      0
    );

    return {
      ...weekData,
      drivers: driversToShow,
      totalStops: newTotalStops,
      subtotal: newSubtotal,
      totalDeductions: newTotalDeductions,
      netPay: newNetPay,
    };
  })
  .filter((week) => week.drivers.length > 0);

  return (
    <AdminLayout
      title="Payroll"
      variant={isAdmin ? "admin" : "driver"}
      rightNameOverride={rightName}
    >
      {isAdmin && (
        <div className="payroll-filter-bar">
          <DriverFilterDropdown
            drivers={allDrivers}
            selectedDrivers={selectedDrivers}
            onChange={setSelectedDrivers}
            title="Driver"
          />
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

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
                <th>Deduction</th>
                <th>Net Pay</th>
                <th>Actions</th>
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
                          {isExpanded ? <LuChevronDown /> : <LuChevronRight />}{" "}
                          Week {weekData.weekNumber}
                        </td>
                        <td>{weekData.payPeriod}</td>
                        <td></td>
                        {/* --- FIX: Display recalculated totals --- */}
                        <td>
                          <span className="summary-label">total: </span>
                          {weekData.totalStops}
                        </td>
                        <td>
                          <span className="summary-label">sub total: </span>$
                          {weekData.subtotal.toFixed(2)}
                        </td>
                        <td className="text-danger">
                          <span className="summary-label">total: </span>$
                          {weekData.totalDeductions.toFixed(2)}
                        </td>
                        <td className="text-success fw-bold">
                          <span className="summary-label">sum: </span>$
                          {weekData.netPay.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>

                      {isExpanded &&
                        weekData.drivers.map((driver) => {
                          
                          const isEditingThis =
                            isAdmin &&
                            editingDeduction?.driverId === driver.driverId &&
                            editingDeduction?.weekNumber ===
                              weekData.weekNumber;

                          return (
                            <tr key={driver.driverId}>
                              <td>{weekData.weekNumber}</td>
                              <td>{weekData.payPeriod}</td>
                              <td>{driver.driverName}</td>
                              <td>{driver.totalStops}</td>
                              <td>${driver.subtotal.toFixed(2)}</td>

                              {/* --- FIX: Deduction Cell --- */}
                              <td className="text-danger">
                                {isEditingThis ? (
                                  <div className="deduction-edit-cell">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="form-control form-control-sm"
                                      value={currentDeductionValue}
                                      onChange={(e) =>
                                        setCurrentDeductionValue(e.target.value)
                                      }
                                      disabled={isSaving}
                                    />
                                    {editError && (
                                      <div className="deduction-edit-error">
                                        {editError}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  `$${driver.totalDeduction.toFixed(2)}`
                                )}
                              </td>

                              {/* --- FIX: NetPay Cell --- */}
                              <td className="text-success fw-bold">
                                ${driver.netPay.toFixed(2)}
                              </td>

                              {/* --- FIX: Actions Cell --- */}
                              <td className="action-cell">
                                {isAdmin ? (
                                  isEditingThis ? (
                                    <div className="deduction-edit-actions">
                                      <button
                                        className="btn btn-sm btn-success-soft"
                                        onClick={handleSaveDeduction}
                                        disabled={isSaving}
                                      >
                                        {isSaving ? "..." : <LuCheck />}
                                      </button>
                                      <button
                                        className="btn btn-sm btn-danger-soft"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                      >
                                        <LuX />
                                      </button>
                                    </div>
                                  ) : (
                                    
                                    <div className="admin-action-buttons">
                                      <button
                                        className="btn btn-sm btn-outline-pay-primary mx-2"
                                        title="Edit Deduction"
                                        onClick={() =>
                                          handleEditDeduction(
                                            driver.driverId,
                                            weekData.weekNumber,
                                            driver.totalDeduction
                                          )
                                        }
                                      >
                                        <LuPencil />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-pay-primary"
                                        title="View Details"
                                        onClick={() =>
                                          handleShowDetails(driver)
                                        }
                                      >
                                        <LuList />
                                      </button>
                                    </div>
                                    
                                  )
                                ) : (
                                  
                                  <button
                                    className="btn btn-outline-pay-primary"
                                    onClick={() => handleShowDetails(driver)}
                                  >
                                    Details
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center p-4">
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
              <span style={{ color: "#000" }}>Name:</span>{" "}
              {selectedDriver.driverName} <br />
              <span style={{ color: "#000" }}>OFID:</span>{" "}
              {selectedDriver.driverId}
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
                {(selectedDriver.zipBreakdown || []).map((zip, idx) => (
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


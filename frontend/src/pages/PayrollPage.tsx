import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { listDrivers } from "../services/adminApi";
import PayrollViewToggle from "../components/PayrollViewToggle";

// --- Types ---
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
  totalBonus: number;
  netPay: number;
  zipBreakdown: ZipBreakdown[];
};

type PayrollData = {
  weekNumber: number;
  payPeriod: string;
  totalStops: number;
  subtotal: number;
  totalDeductions: number;
  totalBonuses: number;
  netPay: number;
  drivers: Driver[];
};

type DriverPayrollRecord = {
  weekNumber: number;
  payPeriod: string;
  totalStops: number;
  subtotal: number;
  totalDeduction: number;
  totalBonus?: number;
  netPay: number;
  zipBreakdown: ZipBreakdown[];
};

type DailyPayrollRecord = {
  driverId: number;
  driverName: string;
  date: string;
  totalStops: number;
  subtotal: number;
  deduction: number;
  bonus: number;
  netPay: number;
};

// --- Helper ---
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
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
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

  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [dailyPayrollData, setDailyPayrollData] = useState<DailyPayrollRecord[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const [allDrivers, setAllDrivers] = useState<string[]>([]);

  const [editingDeduction, setEditingDeduction] = useState<{
    driverId: number;
    weekNumber: number;
  } | null>(null);
  const [currentDeductionValue, setCurrentDeductionValue] = useState<number | string>("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingBonus, setEditingBonus] = useState<{
    driverId: number;
    weekNumber: number;
  } | null>(null);
  const [currentBonusValue, setCurrentBonusValue] = useState<number | string>("");
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [isSavingBonus, setIsSavingBonus] = useState(false);

  const fetchPayrollData = useCallback(async () => {
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
        const driverRecords: DriverPayrollRecord[] = Array.isArray(rawData) ? rawData : [];
        data = driverRecords.map((record) => {
          const driver: Driver = {
            driverId: Number(driverId),
            driverName: driverName,
            totalStops: record.totalStops,
            subtotal: record.subtotal,
            totalDeduction: record.totalDeduction,
            totalBonus: record.totalBonus || 0,
            netPay: record.netPay,
            zipBreakdown: record.zipBreakdown || [],
          };

          return {
            weekNumber: record.weekNumber,
            payPeriod: record.payPeriod || "",
            totalStops: record.totalStops,
            subtotal: record.subtotal,
            totalDeductions: record.totalDeduction,
            totalBonuses: record.totalBonus || 0,
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
  }, [isAdmin, driverId, driverName]);

  const fetchDailyPayrollData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && dailyPayrollData.length > 0) return;
    setDailyLoading(true);
    setDailyError(null);
    try {
      const endpoint = isAdmin
        ? `${port}/uploads/payroll/daily`
        : `${port}/uploads/payroll/daily/${driverId}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch daily payroll data");
      }

      const rawData = await res.json();
      setDailyPayrollData(Array.isArray(rawData) ? rawData : []);
    } catch (err: any) {
      setDailyError(err?.message || "Failed to load daily data");
    } finally {
      setDailyLoading(false);
    }
  }, [isAdmin, driverId, dailyPayrollData.length]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  useEffect(() => {
    const fetchDrivers = async () => {
      if (!isAdmin) return;
      try {
        const driverData = await listDrivers(token);
        const names = driverData.map((d: any) => d.fullName).filter(Boolean) as string[];
        setAllDrivers(names.sort());
      } catch (err) {
        console.error("Failed to load driver names for filter", err);
        setAllDrivers([]);
      }
    };
    fetchDrivers();
  }, [isAdmin, token]);

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

  const handleEditBonus = (driverId: number, weekNumber: number, currentAmount: number) => {
    setEditingBonus({ driverId, weekNumber });
    setCurrentBonusValue(currentAmount);
    setBonusError(null);
  };

  const handleCancelBonus = () => {
    setEditingBonus(null);
    setCurrentBonusValue("");
    setBonusError(null);
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
        body: JSON.stringify({ driverId, weekNumber, totalDeduction }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save deduction");
      }

      const updatedPayrollRecord = await res.json();

      setPayrollData((prevData) => {
        return prevData.map((week) => {
          if (week.weekNumber !== weekNumber) return week;

          const newDrivers = week.drivers.map((driver) => {
            if (driver.driverId === driverId) {
              return {
                ...driver,
                totalDeduction: updatedPayrollRecord.totalDeduction,
                netPay: updatedPayrollRecord.netPay,
              };
            }
            return driver;
          });

          const newWeekSubtotal = newDrivers.reduce((sum, d) => sum + (d.subtotal || 0), 0);
          const newWeekTotalStops = newDrivers.reduce((sum, d) => sum + (d.totalStops || 0), 0);
          const newWeekTotalDeductions = newDrivers.reduce((sum, d) => sum + (d.totalDeduction || 0), 0);
          const newWeekTotalBonuses = newDrivers.reduce((sum, d) => sum + (d.totalBonus || 0), 0);
          const newWeekNetPay = newDrivers.reduce((sum, d) => sum + (d.netPay || 0), 0);

          return {
            ...week,
            drivers: newDrivers,
            totalStops: newWeekTotalStops,
            subtotal: newWeekSubtotal,
            totalDeductions: newWeekTotalDeductions,
            totalBonuses: newWeekTotalBonuses,
            netPay: newWeekNetPay,
          };
        });
      });

      setEditingDeduction(null);
      // Force fetching Daily Payroll so changes propagate immediately
      fetchDailyPayrollData(true);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBonus = async () => {
    if (!editingBonus || isSavingBonus) return;
    const { driverId, weekNumber } = editingBonus;
    const totalBonus = Number(currentBonusValue);
    if (isNaN(totalBonus) || totalBonus < 0) {
      setBonusError("Invalid bonus amount.");
      return;
    }
    setIsSavingBonus(true);
    setBonusError(null);
    try {
      const res = await fetch(`${port}/uploads/payroll/bonus`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ driverId, weekNumber, totalBonus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save bonus");
      }
      const updatedRecord = await res.json();
      setPayrollData((prevData) =>
        prevData.map((week) => {
          if (week.weekNumber !== weekNumber) return week;
          
          const newDrivers = week.drivers.map((driver) => {
            if (driver.driverId === driverId) {
              return {
                ...driver,
                totalBonus: updatedRecord.totalBonus,
                netPay: updatedRecord.netPay,
              };
            }
            return driver;
          });

          const newWeekSubtotal = newDrivers.reduce((sum, d) => sum + (d.subtotal || 0), 0);
          const newWeekTotalStops = newDrivers.reduce((sum, d) => sum + (d.totalStops || 0), 0);
          const newWeekTotalDeductions = newDrivers.reduce((sum, d) => sum + (d.totalDeduction || 0), 0);
          const newWeekTotalBonuses = newDrivers.reduce((sum, d) => sum + (d.totalBonus || 0), 0);
          const newWeekNetPay = newDrivers.reduce((sum, d) => sum + (d.netPay || 0), 0);

          return {
            ...week,
            drivers: newDrivers,
            totalStops: newWeekTotalStops,
            subtotal: newWeekSubtotal,
            totalDeductions: newWeekTotalDeductions,
            totalBonuses: newWeekTotalBonuses,
            netPay: newWeekNetPay,
          };
        })
      );
      setEditingBonus(null);
      // Force fetching Daily Payroll so changes propagate immediately
      fetchDailyPayrollData(true);
    } catch (err: any) {
      setBonusError(err.message);
    } finally {
      setIsSavingBonus(false);
    }
  };

  const filteredPayrollData = useMemo(() => {
    return payrollData.map((weekData) => {
      const driversToShow = isAdmin
        ? weekData.drivers.filter((driver) =>
            selectedDrivers.length
              ? selectedDrivers.some((selected) => {
                  const driverName = driver.driverName?.trim().toLowerCase() || "";
                  const selectedName = selected?.trim().toLowerCase() || "";
                  return driverName === selectedName;
                })
              : true,
          )
        : weekData.drivers;

      const subtotal = driversToShow.reduce((sum, d) => sum + d.subtotal, 0);
      const totalStops = driversToShow.reduce((sum, d) => sum + d.totalStops, 0);
      const totalDeductions = driversToShow.reduce((sum, d) => sum + d.totalDeduction, 0);
      const totalBonuses = driversToShow.reduce((sum, d) => sum + (d.totalBonus || 0), 0);
      const netPay = driversToShow.reduce((sum, d) => sum + d.netPay, 0);

      return {
        ...weekData,
        drivers: driversToShow,
        subtotal,
        totalStops,
        totalDeductions,
        totalBonuses,
        netPay,
      };
    }).filter(week => week.drivers.length > 0);
  }, [payrollData, selectedDrivers, isAdmin]);

  const filteredDailyData = useMemo(() => {
    return dailyPayrollData.filter((record) => {
      const dateMatch = selectedDate ? record.date.startsWith(selectedDate) : true;
      const driverMatch = selectedDrivers.length
        ? selectedDrivers.some((selected) => {
            const driverName = record.driverName?.trim().toLowerCase() || "";
            const selectedName = selected?.trim().toLowerCase() || "";
            return driverName === selectedName;
          })
        : true;
      return dateMatch && driverMatch;
    });
  }, [dailyPayrollData, selectedDate, selectedDrivers]);

  const renderWeeklyTable = () => (
    <div className="table-responsive card p-3">
      {loading && <div className="p-3">Loading weekly data...</div>}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      {!loading && !error && (
        <table className="table table-borderless align-middle mb-0 custom-table text-center">
          <thead>
            <tr>
              <th>Week Number</th>
              <th>Pay Period</th>
              <th>Driver</th>
              <th>Total Stops</th>
              <th>Subtotal</th>
              <th>Deduction</th>
              <th>Bonus</th>
              <th>Net Pay</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayrollData.length > 0 ? (
              filteredPayrollData.map((weekData) => {
                const isExpanded = expandedWeek === String(weekData.weekNumber);
                return (
                  <React.Fragment key={weekData.weekNumber}>
                    <tr
                      className="week-summary-row"
                      onClick={() => toggleWeek(String(weekData.weekNumber))}
                    >
                      <td>
                        {isExpanded ? <LuChevronDown /> : <LuChevronRight />}{" "}
                        Week {String(weekData.weekNumber).slice(0, 4)}-
                        {String(weekData.weekNumber).slice(4)}
                      </td>
                      <td>{weekData.payPeriod}</td>
                      <td></td>
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
                      <td className="text-success">
                        <span className="summary-label">total: </span>$
                        {weekData.totalBonuses.toFixed(2)}
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
                          editingDeduction?.weekNumber === weekData.weekNumber;

                        const isEditingBonusThis =
                          isAdmin &&
                          editingBonus?.driverId === driver.driverId &&
                          editingBonus?.weekNumber === weekData.weekNumber;

                        return (
                          <tr key={driver.driverId}>
                            <td>
                              Week {String(weekData.weekNumber).slice(0, 4)}-
                              {String(weekData.weekNumber).slice(4)}
                            </td>
                            <td>{weekData.payPeriod}</td>
                            <td>{driver.driverName}</td>
                            <td>{driver.totalStops}</td>
                            <td>${driver.subtotal.toFixed(2)}</td>

                            <td className="text-danger">
                              {isEditingThis ? (
                                <div className="deduction-edit-cell">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={currentDeductionValue}
                                    onChange={(e) => setCurrentDeductionValue(e.target.value)}
                                    disabled={isSaving}
                                  />
                                  {editError && (
                                    <div className="deduction-edit-error">{editError}</div>
                                  )}
                                  <div className="deduction-edit-actions" style={{ marginTop: 4 }}>
                                    <button className="btn btn-sm btn-success-soft" style={{ color: 'green' }} onClick={handleSaveDeduction} disabled={isSaving}>
                                      {isSaving ? '...' : <LuCheck />}
                                    </button>
                                    <button className="btn btn-sm btn-danger-soft" style={{ color: 'red' }} onClick={handleCancelEdit} disabled={isSaving}>
                                      <LuX />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <span>${driver.totalDeduction.toFixed(2)}</span>
                                  {isAdmin && (
                                    <button
                                      className="btn btn-xs btn-link p-0 text-danger"
                                      title="Edit Deduction"
                                      onClick={(e) => { e.stopPropagation(); handleEditDeduction(driver.driverId, weekData.weekNumber, driver.totalDeduction); }}
                                      style={{ border: 'none', background: 'none' }}
                                    >
                                      <LuPencil size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="text-success">
                              {isEditingBonusThis ? (
                                <div className="deduction-edit-cell">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={currentBonusValue}
                                    onChange={(e) => setCurrentBonusValue(e.target.value)}
                                    disabled={isSavingBonus}
                                  />
                                  {bonusError && (
                                    <div className="deduction-edit-error">{bonusError}</div>
                                  )}
                                  <div className="deduction-edit-actions" style={{ marginTop: 4 }}>
                                    <button className="btn btn-sm btn-success-soft" style={{ color: 'green' }} onClick={handleSaveBonus} disabled={isSavingBonus}>
                                      {isSavingBonus ? '...' : <LuCheck />}
                                    </button>
                                    <button className="btn btn-sm btn-danger-soft" style={{ color: 'red' }} onClick={handleCancelBonus} disabled={isSavingBonus}>
                                      <LuX />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <span>${(driver.totalBonus || 0).toFixed(2)}</span>
                                  {isAdmin && (
                                    <button
                                      className="btn btn-xs btn-link p-0 text-success"
                                      title="Edit Bonus"
                                      onClick={(e) => { e.stopPropagation(); handleEditBonus(driver.driverId, weekData.weekNumber, driver.totalBonus || 0); }}
                                      style={{ border: 'none', background: 'none' }}
                                    >
                                      <LuPencil size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="text-success fw-bold">
                              ${driver.netPay.toFixed(2)}
                            </td>

                            <td className="action-cell">
                              <button
                                className="btn btn-sm btn-outline-pay-primary"
                                title="View Details"
                                onClick={() => handleShowDetails(driver)}
                              >
                                {isAdmin ? <LuList /> : 'Details'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center p-4">
                  {payrollData.length > 0
                    ? 'No matching payroll data found.'
                    : 'No payroll data available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderDailyTable = () => (
    <div className="table-responsive card p-3">
      {dailyLoading && <div className="p-3">Loading daily data...</div>}
      {dailyError && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {dailyError}
        </div>
      )}
      {!dailyLoading && !dailyError && (
        <table className="table table-borderless align-middle mb-0 custom-table text-center">
          <thead>
            <tr>
              <th>Date</th>
              <th>Driver</th>
              <th>Stops</th>
              <th>Subtotal</th>
              <th>Deduction</th>
              <th>Bonus</th>
              <th>Net Pay</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDailyData.length > 0 ? (
              filteredDailyData.map((record, i) => (
                <tr key={i}>
                  <td>{record.date}</td>
                  <td>{record.driverName}</td>
                  <td>{record.totalStops}</td>
                  <td>${(record.subtotal ?? 0).toFixed(2)}</td>
                  <td className="text-danger">${(record.deduction ?? 0).toFixed(2)}</td>
                  <td className="text-success">${(record.bonus ?? 0).toFixed(2)}</td>
                  <td className="text-success fw-bold">${(record.netPay ?? 0).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-pay-primary"
                      onClick={() => {
                        const d: Driver = {
                          driverId: record.driverId,
                          driverName: record.driverName,
                          totalStops: record.totalStops,
                          subtotal: record.subtotal,
                          totalDeduction: record.deduction,
                          totalBonus: record.bonus,
                          netPay: record.netPay,
                          zipBreakdown: [],
                        };
                        handleShowDetails(d);
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  No daily records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="payroll-page-container">
        <div className="payroll-header d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Payroll</h2>
          <div className="d-flex align-items-center gap-3">
            <PayrollViewToggle
              viewMode={viewMode}
              onChange={(mode) => {
                setViewMode(mode);
                if (mode === "daily") fetchDailyPayrollData();
              }}
            />
          </div>
        </div>

        <div className="filters-card card p-3 mb-4">
          <div className="row align-items-end g-3">
            <div className="col-md-3">
              <label className="form-label small text-muted text-uppercase fw-bold">
                Filter by Driver
              </label>
              <DriverFilterDropdown
                drivers={allDrivers}
                selectedDrivers={selectedDrivers}
                onChange={setSelectedDrivers}
              />
            </div>
            {viewMode === "daily" && (
              <div className="col-md-3">
                <label className="form-label small text-muted text-uppercase fw-bold">
                  Filter by Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {viewMode === "weekly" ? renderWeeklyTable() : renderDailyTable()}

        {selectedDriver && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header bg-white border-bottom-0">
                  <h5 className="modal-title text-dark fw-bold">Payroll Details: {selectedDriver.driverName}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 border rounded bg-white">
                        <label className="text-secondary small text-uppercase fw-bold mb-1 d-block">Total Stops</label>
                        <h4 className="mb-0 text-dark fw-bold">{selectedDriver.totalStops}</h4>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-3 border rounded bg-white">
                        <label className="text-secondary small text-uppercase fw-bold mb-1 d-block">Net Pay</label>
                        <h4 className="mb-0 text-success fw-bold">${selectedDriver.netPay.toFixed(2)}</h4>
                      </div>
                    </div>
                  </div>

                  <h6 className="mt-4 mb-3 text-uppercase small fw-bold text-secondary">Zip Code Breakdown</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover border">
                      <thead className="table-light">
                        <tr>
                          <th>Zip Code</th>
                          <th className="text-center">Stops</th>
                          <th className="text-end">Rate</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDriver.zipBreakdown.map((zip, idx) => (
                          <tr key={idx}>
                            <td>{zip.zip}</td>
                            <td className="text-center">{zip.stops}</td>
                            <td className="text-end">${zip.rate.toFixed(2)}</td>
                            <td className="text-end fw-bold">${zip.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light fw-bold">
                        <tr>
                          <td>TOTAL</td>
                          <td className="text-center">{selectedDriver.totalStops}</td>
                          <td></td>
                          <td className="text-end text-success">${selectedDriver.subtotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PayrollPage;
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DriversPage from "./pages/Drivers";
import FileUploadForm from "./components/FileUploadForm";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import DeleteDataPage from "./pages/DeleteDataPage";
import RoutePaths from "./pages/RoutePaths";
import DriversDirectory from "./pages/DriversDirectory";

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

function defaultRouteForRole(role: "admin" | "driver" | "") {
  return role === "driver" ? "/upload" : "/dashboard";
}

const ProtectedRoute: React.FC<{
  allow?: Array<"admin" | "driver">;
  children: React.ReactNode;
}> = ({ allow, children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;

  const role = getRoleName();
  if (allow && allow.length > 0 && role !== "" && !allow.includes(role)) {
    return <Navigate to={defaultRouteForRole(role)} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const role = getRoleName();
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
    
        {/* Admin-only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allow={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute allow={["admin"]}>
              <DriversPage />
            </ProtectedRoute>
          }
        />

        {/* Upload: both roles */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute allow={["admin", "driver"]}>
              <FileUploadForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delete-data"
          element={
            <ProtectedRoute allow={["admin"]}>
              <DeleteDataPage />
            </ProtectedRoute>
          }
        />
          <Route
          path="/routes"
          element={
            <ProtectedRoute allow={["admin"]}>
              <RoutePaths />
            </ProtectedRoute>
          }
        />
                  <Route
          path="/drivers-directory"
          element={
            <ProtectedRoute allow={["admin"]}>
              <DriversDirectory />
            </ProtectedRoute>
          }
        />
        {/* Fallback: driver -> /upload, admin -> /dashboard */}
        <Route
          path="*"
          element={<Navigate to={defaultRouteForRole(role)} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

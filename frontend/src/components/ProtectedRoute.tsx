import React, { type JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRole?: "admin" | "driver";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const roleStr = localStorage.getItem("role") as ("admin" | "driver" | null);

  if (!token) return <Navigate to="/" replace />;

  if (allowedRole && roleStr && roleStr !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

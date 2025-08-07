import React, { type JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRole?: "admin" | "driver"; // optional role-based restriction
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as "admin" | "driver" | null;

  // If no token → redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If allowedRole is set but doesn't match stored role → redirect to login
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

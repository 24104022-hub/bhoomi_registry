import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function ProtectedRoute({ children, allow }) {
  const { user, addToast } = useApp();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allow) {
    const normalizedUserRole = user.role === "registrar" ? "officer" : user.role;
    const isAllowed = allow.some((role) => {
      const normalizedAllow = role === "registrar" ? "officer" : role;
      return normalizedAllow === normalizedUserRole;
    });

    if (!isAllowed) {
      return (
        <div className="page-container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="card" style={{ maxWidth: "480px", margin: "0 auto", padding: "32px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🛡️</div>
            <h2>Access Restricted</h2>
            <p style={{ color: "var(--ink-soft)", margin: "0 0 20px" }}>
              Your current role <strong>({user.role})</strong> does not have authorization to view this area. Restricted to [{allow.join(", ")}].
            </p>
            <Navigate to="/app/dashboard" replace />
          </div>
        </div>
      );
    }
  }

  return children;
}

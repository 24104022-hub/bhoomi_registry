import React from "react";

export default function FormField({ label, hint, error, children }) {
  return (
    <div className={`field ${error ? "error" : ""}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

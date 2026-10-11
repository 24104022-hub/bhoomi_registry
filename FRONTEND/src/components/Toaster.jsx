import React from "react";
import { useApp } from "../context/AppContext.jsx";

export default function Toaster() {
  const { toasts, removeToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.variant === "error" ? "toast-error" : ""}`}
          onClick={() => removeToast(toast.id)}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

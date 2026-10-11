import React, { useEffect } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function Modal({ title, children, onClose, onConfirm, confirmLabel, danger }) {
  const { t } = useApp();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={title}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div>{children}</div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t("common_cancel")}</button>
          {onConfirm && (
            <button className={`btn ${danger ? "btn-maroon" : "btn-primary"}`} onClick={onConfirm}>
              {confirmLabel || t("common_confirm")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

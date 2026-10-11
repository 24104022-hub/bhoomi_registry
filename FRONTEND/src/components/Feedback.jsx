import React from "react";
import { useApp } from "../context/AppContext.jsx";

export function Loader() {
  const { t } = useApp();
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{t("common_loading")}</span>
    </div>
  );
}

export function EmptyState({ title, description }) {
  const { t } = useApp();
  return (
    <div className="state-block">
      <h3>{title || t("common_noData")}</h3>
      <p>{description || t("common_noDataDesc")}</p>
    </div>
  );
}

export function ErrorState({ onRetry, description }) {
  const { t } = useApp();
  return (
    <div className="state-block error-state">
      <h3>{t("common_errorTitle")}</h3>
      <p>{description || t("common_errorDesc")}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ marginTop: 10 }}>
          {t("common_retry")}
        </button>
      )}
    </div>
  );
}

const BADGE_VARIANTS = {
  pending: "gold",
  underReview: "blue",
  approved: "green",
  rejected: "maroon",
  completed: "green",
  active: "green",
  verified: "green",
  paid: "green",
  due: "gold",
  failed: "maroon",
  scheduled: "blue",
  cancelled: "neutral",
};

export function StatusBadge({ status }) {
  const { t } = useApp();
  const variant = BADGE_VARIANTS[status] || "neutral";
  const label = t(`status_${status}`) !== `status_${status}` ? t(`status_${status}`)
    : t(`docs_${status}`) !== `docs_${status}` ? t(`docs_${status}`)
    : t(`pay_${status}`) !== `pay_${status}` ? t(`pay_${status}`)
    : t(`appt_${status}`) !== `appt_${status}` ? t(`appt_${status}`)
    : status;
  return <span className={`badge badge-${variant}`}>{label}</span>;
}

export function StatCard({ label, value, foot }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {foot && <p className="stat-foot">{foot}</p>}
    </div>
  );
}

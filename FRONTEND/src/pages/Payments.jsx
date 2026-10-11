import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState, StatusBadge } from "../components/Feedback.jsx";
import FormField from "../components/FormField.jsx";
import Modal from "../components/Modal.jsx";

export default function Payments() {
  const { t, addToast } = useApp();
  const { data, loading, error, reload } = useAsync(() => api.payments.list(), []);
  const [status, setStatus] = useState("all");
  const [payTarget, setPayTarget] = useState(null);
  const [method, setMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    return status === "all" ? data : data.filter((p) => p.status === status);
  }, [data, status]);

  const total = useMemo(() => filtered.reduce((sum, p) => sum + p.amount, 0), [filtered]);

  async function confirmPayment() {
    if (!payTarget) return;
    setProcessing(true);
    try {
      await api.payments.update(payTarget.id, { status: "paid", method });
      addToast(t("pay_paid"));
      setPayTarget(null);
      reload();
    } catch {
      addToast(t("common_errorDesc"), "error");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("pay_title")}</h1>
          <p className="page-desc">{t("pay_desc")}</p>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <p className="stat-label">{t("common_amount")}</p>
          <p className="stat-value">₹{total.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{t("pay_due")}</p>
          <p className="stat-value">{data?.filter((p) => p.status === "due").length ?? "—"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{t("pay_paid")}</p>
          <p className="stat-value">{data?.filter((p) => p.status === "paid").length ?? "—"}</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{t("common_all")}</option>
          <option value="due">{t("pay_due")}</option>
          <option value="paid">{t("pay_paid")}</option>
          <option value="failed">{t("pay_failed")}</option>
        </select>
      </div>

      {loading && <Loader />}
      {error && <ErrorState onRetry={reload} />}
      {!loading && !error && filtered.length === 0 && <EmptyState />}

      {!loading && !error && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>{t("common_reference")}</th>
                <th>{t("docs_relatedTo")}</th>
                <th>Description</th>
                <th>{t("common_amount")}</th>
                <th>{t("common_date")}</th>
                <th>{t("common_status")}</th>
                <th>{t("common_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.relatedTo}</td>
                  <td>{p.description}</td>
                  <td>₹{p.amount.toLocaleString()}</td>
                  <td>{p.date}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    {p.status !== "paid" && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setPayTarget(p); setMethod(p.method || "UPI"); }}>
                        {t("pay_makePayment")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {payTarget && (
        <Modal title={t("pay_makePayment")} onClose={() => setPayTarget(null)} onConfirm={confirmPayment} confirmLabel={processing ? "…" : t("common_confirm")}>
          <p style={{ marginTop: 0 }}>{payTarget.description} — <strong>₹{payTarget.amount.toLocaleString()}</strong></p>
          <FormField label={t("pay_method")}>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>UPI</option>
              <option>Net Banking</option>
              <option>Card</option>
            </select>
          </FormField>
        </Modal>
      )}
    </div>
  );
}

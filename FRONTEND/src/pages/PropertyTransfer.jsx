import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState, StatusBadge } from "../components/Feedback.jsx";
import FormField from "../components/FormField.jsx";
import { canReview } from "../utils/roleConfig.js";

export default function PropertyTransfer() {
  const { t, user, addToast } = useApp();
  const { data: transfers, loading, error, reload } = useAsync(() => api.transfers.list(), []);
  const { data: myProperties } = useAsync(
    () => api.properties.list(user?.role === "citizen" ? { ownerId: user.id } : {}),
    [user?.id, user?.role]
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ propertyId: "", toOwner: "", toEmail: "", transferType: "Sale" });
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const property = myProperties?.find((p) => p.id === form.propertyId);
      await api.transfers.create({
        propertyId: form.propertyId,
        propertyTitle: property?.title || form.propertyId,
        fromOwner: property?.ownerName || user.fullName,
        toOwner: form.toOwner,
        toEmail: form.toEmail,
        transferType: form.transferType,
        status: "pending",
        initiatedOn: new Date().toISOString().slice(0, 10),
      }, "TR");
      addToast(t("transfer_submitted"));
      setShowForm(false);
      setForm({ propertyId: "", toOwner: "", toEmail: "", transferType: "Sale" });
      reload();
    } catch (err) {
      addToast(err.message || t("common_errorDesc"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(id, status) {
    try {
      if (status === "approved") {
        await api.transfers.approve(id, { remarks: "Approved by Registrar" });
      } else if (status === "rejected") {
        await api.transfers.reject(id, { remarks: "Rejected by Registrar" });
      } else {
        await api.transfers.update(id, { status });
      }
      addToast(status === "approved" ? "Transfer approved successfully!" : status === "rejected" ? "Transfer rejected." : t("common_save"));
      reload();
    } catch (err) {
      addToast(err.message || "Failed to update transfer status", "error");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("transfer_title")}</h1>
          <p className="page-desc">{t("transfer_desc")}</p>
        </div>
        {user.role === "citizen" && (
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? t("common_cancel") : t("transfer_submit")}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card" style={{ maxWidth: 560, marginBottom: 24 }} onSubmit={handleSubmit}>
          <FormField label={t("transfer_selectProperty")}>
            <select required value={form.propertyId} onChange={(e) => update("propertyId", e.target.value)}>
              <option value="">—</option>
              {myProperties?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </FormField>
          <div className="form-row">
            <FormField label={t("transfer_buyerName")}>
              <input required value={form.toOwner} onChange={(e) => update("toOwner", e.target.value)} />
            </FormField>
            <FormField label={t("transfer_buyerEmail")}>
              <input required type="email" value={form.toEmail} onChange={(e) => update("toEmail", e.target.value)} />
            </FormField>
          </div>
          <FormField label={t("transfer_transferType")}>
            <select value={form.transferType} onChange={(e) => update("transferType", e.target.value)}>
              <option value="Sale">{t("transfer_sale")}</option>
              <option value="Gift">{t("transfer_gift")}</option>
              <option value="Inheritance">{t("transfer_inheritance")}</option>
            </select>
          </FormField>
          <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "…" : t("transfer_submit")}</button>
        </form>
      )}

      {loading && <Loader />}
      {error && <ErrorState onRetry={reload} />}
      {!loading && !error && transfers?.length === 0 && <EmptyState />}

      {!loading && !error && transfers?.length > 0 && (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>{t("common_reference")}</th>
                <th>{t("properties_title")}</th>
                <th>From</th>
                <th>To</th>
                <th>{t("transfer_transferType")}</th>
                <th>{t("common_status")}</th>
                {canReview(user.role) && <th>{t("common_actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr) => (
                <tr key={tr.id}>
                  <td>{tr.id}</td>
                  <td>{tr.propertyTitle}</td>
                  <td>{tr.fromOwner}</td>
                  <td>{tr.toOwner}</td>
                  <td>{tr.transferType}</td>
                  <td><StatusBadge status={tr.status} /></td>
                  {canReview(user.role) && (
                    <td className="table-actions">
                      {tr.status !== "approved" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setStatus(tr.id, "approved")}>{t("status_approved")}</button>
                      )}
                      {tr.status !== "rejected" && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatus(tr.id, "rejected")}>{t("status_rejected")}</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

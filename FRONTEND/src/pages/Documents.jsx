import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState, StatusBadge } from "../components/Feedback.jsx";
import FormField from "../components/FormField.jsx";
import Modal from "../components/Modal.jsx";
import { canCertifyDocuments } from "../utils/roleConfig.js";

export default function Documents() {
  const { t, user, addToast } = useApp();
  const { data, loading, error, reload } = useAsync(() => api.documents.list(), []);
  const [status, setStatus] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ name: "", relatedTo: "", category: "Deed" });
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    return status === "all" ? data : data.filter((d) => d.status === status);
  }, [data, status]);

  async function handleUpload(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.documents.create({
        ...form, status: "pending", uploadedOn: new Date().toISOString().slice(0, 10), uploadedBy: user.fullName,
      }, "DOC");
      addToast(t("common_save"));
      setShowUpload(false);
      setForm({ name: "", relatedTo: "", category: "Deed" });
      reload();
    } catch {
      addToast(t("common_errorDesc"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function setDocStatus(id, s) {
    await api.documents.update(id, { status: s });
    addToast(t("common_save"));
    reload();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("docs_title")}</h1>
          <p className="page-desc">{t("docs_desc")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>{t("docs_upload")}</button>
      </div>

      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{t("common_all")}</option>
          <option value="pending">{t("docs_pending")}</option>
          <option value="verified">{t("docs_verified")}</option>
          <option value="rejected">{t("docs_rejected")}</option>
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
                <th>{t("docs_fileName")}</th>
                <th>{t("docs_relatedTo")}</th>
                <th>{t("common_type")}</th>
                <th>{t("common_date")}</th>
                <th>{t("common_status")}</th>
                {canCertifyDocuments(user.role) && <th>{t("common_actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.relatedTo}</td>
                  <td>{d.category}</td>
                  <td>{d.uploadedOn}</td>
                  <td><StatusBadge status={d.status} /></td>
                  {canCertifyDocuments(user.role) && (
                    <td className="table-actions">
                      {d.status !== "verified" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setDocStatus(d.id, "verified")}>{t("docs_verified")}</button>
                      )}
                      {d.status !== "rejected" && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDocStatus(d.id, "rejected")}>{t("docs_rejected")}</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && (
        <Modal title={t("docs_upload")} onClose={() => setShowUpload(false)} onConfirm={handleUpload} confirmLabel={submitting ? "…" : t("common_submit")}>
          <form onSubmit={handleUpload}>
            <FormField label={t("docs_fileName")}>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="document.pdf" />
            </FormField>
            <FormField label={t("docs_relatedTo")} hint="Property, registration, or transfer reference">
              <input required value={form.relatedTo} onChange={(e) => setForm((f) => ({ ...f, relatedTo: e.target.value }))} placeholder="PR-9001" />
            </FormField>
            <FormField label={t("common_type")}>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option>Deed</option>
                <option>ID Proof</option>
                <option>Survey Certificate</option>
                <option>Legal</option>
              </select>
            </FormField>
          </form>
        </Modal>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState, StatusBadge } from "../components/Feedback.jsx";
import FormField from "../components/FormField.jsx";
import Modal from "../components/Modal.jsx";

export default function Appointments() {
  const { t, user, addToast } = useApp();
  const { data, loading, error, reload } = useAsync(() => api.appointments.list(), []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ purpose: "Boundary survey", relatedTo: "", dateTime: "", assignedTo: "P. Lakshmi", role: "surveyor" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.appointments.create({
        ...form, citizenName: user.fullName, status: "scheduled",
      }, "APT");
      addToast(t("common_save"));
      setShowForm(false);
      reload();
    } catch {
      addToast(t("common_errorDesc"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(id, status) {
    await api.appointments.update(id, { status });
    addToast(t("common_save"));
    reload();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("appt_title")}</h1>
          <p className="page-desc">{t("appt_desc")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>{t("appt_book")}</button>
      </div>

      {loading && <Loader />}
      {error && <ErrorState onRetry={reload} />}
      {!loading && !error && data?.length === 0 && <EmptyState />}

      {!loading && !error && data?.length > 0 && (
        <div className="grid cols-3">
          {data.map((a) => (
            <div className="card" key={a.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p className="card-title">{a.purpose}</p>
                <StatusBadge status={a.status} />
              </div>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", margin: "2px 0" }}>{t("appt_officer")}: {a.assignedTo}</p>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", margin: "2px 0" }}>{t("docs_relatedTo")}: {a.relatedTo}</p>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", margin: "2px 0" }}>{t("appt_time")}: {new Date(a.dateTime).toLocaleString()}</p>
              {a.status === "scheduled" && (
                <div className="record-card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setStatus(a.id, "completed")}>{t("appt_completed")}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(a.id, "cancelled")}>{t("appt_cancelled")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={t("appt_book")} onClose={() => setShowForm(false)} onConfirm={handleSubmit} confirmLabel={submitting ? "…" : t("common_submit")}>
          <form onSubmit={handleSubmit}>
            <FormField label={t("appt_purpose")}>
              <select value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}>
                <option>Boundary survey</option>
                <option>Document verification</option>
                <option>Deed signing</option>
                <option>Legal consultation</option>
              </select>
            </FormField>
            <FormField label={t("docs_relatedTo")}>
              <input value={form.relatedTo} onChange={(e) => setForm((f) => ({ ...f, relatedTo: e.target.value }))} placeholder="REG-2026-0001" />
            </FormField>
            <FormField label={t("appt_time")}>
              <input required type="datetime-local" value={form.dateTime} onChange={(e) => setForm((f) => ({ ...f, dateTime: e.target.value }))} />
            </FormField>
          </form>
        </Modal>
      )}
    </div>
  );
}

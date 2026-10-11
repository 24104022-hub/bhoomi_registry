import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import FormField from "../components/FormField.jsx";
import { roleLabelKey } from "../utils/roleConfig.js";

export default function Profile() {
  const { t, user, updateUser, addToast } = useApp();
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile(user.id, form);
      updateUser(updated);
      addToast(t("profile_updateSuccess"));
    } catch {
      addToast(t("common_errorDesc"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("profile_title")}</h1>
          <p className="page-desc">{t("profile_desc")}</p>
        </div>
      </div>

      <div className="grid cols-2">
        <form className="card" onSubmit={handleSubmit}>
          <p className="card-title">{t("profile_personalInfo")}</p>
          <FormField label={t("register_fullName")}>
            <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </FormField>
          <FormField label={t("register_phone")}>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "…" : t("common_save")}</button>
        </form>

        <div className="card">
          <p className="card-title">{t("profile_accountInfo")}</p>
          <p style={{ fontSize: "0.9rem" }}><strong>{t("login_email")}:</strong> {user.email}</p>
          <p style={{ fontSize: "0.9rem" }}><strong>{t("profile_role")}:</strong> {t(roleLabelKey(user.role))}</p>
          <p style={{ fontSize: "0.9rem" }}><strong>{t("profile_memberSince")}:</strong> {user.createdAt}</p>
          <p style={{ fontSize: "0.9rem" }}><strong>ID:</strong> {user.id}</p>
        </div>
      </div>
    </div>
  );
}

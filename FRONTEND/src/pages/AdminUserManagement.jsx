import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState } from "../components/Feedback.jsx";
import { roleLabelKey } from "../utils/roleConfig.js";
import Modal from "../components/Modal.jsx";

export default function AdminUserManagement() {
  const { t, addToast } = useApp();
  const { data, loading, error, reload } = useAsync(() => api.users.list(), []);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toRemove, setToRemove] = useState(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [data, roleFilter, search]);

  async function handleRemove() {
    if (!toRemove) return;
    await api.users.remove(toRemove.id);
    addToast(t("common_delete"));
    setToRemove(null);
    reload();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("users_title")}</h1>
          <p className="page-desc">{t("users_desc")}</p>
        </div>
      </div>

      <div className="filter-bar">
        <input placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">{t("common_all")}</option>
          <option value="citizen">{t("role_citizen")}</option>
          <option value="officer">{t("role_officer")}</option>
          <option value="surveyor">{t("role_surveyor")}</option>
          <option value="lawyer">{t("role_lawyer")}</option>
          <option value="admin">{t("role_admin")}</option>
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
                <th>{t("register_fullName")}</th>
                <th>{t("login_email")}</th>
                <th>{t("users_role")}</th>
                <th>{t("users_joined")}</th>
                <th>{t("common_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-blue">{t(roleLabelKey(u.role))}</span></td>
                  <td>{u.createdAt}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setToRemove(u)}>{t("common_delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toRemove && (
        <Modal title={t("common_delete")} onClose={() => setToRemove(null)} onConfirm={handleRemove} danger confirmLabel={t("common_delete")}>
          <p>{toRemove.fullName} — {toRemove.email}</p>
        </Modal>
      )}
    </div>
  );
}

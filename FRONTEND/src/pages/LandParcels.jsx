import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState } from "../components/Feedback.jsx";

export default function LandParcels() {
  const { t } = useApp();
  const { data, loading, error, reload } = useAsync(() => api.landParcels.list(), []);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    return data.filter((p) => p.surveyNo.includes(search) || p.village.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("parcels_title")}</h1>
          <p className="page-desc">{t("parcels_desc")}</p>
        </div>
      </div>

      <div className="filter-bar">
        <input placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <Loader />}
      {error && <ErrorState onRetry={reload} />}
      {!loading && !error && filtered.length === 0 && <EmptyState />}

      {!loading && !error && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>{t("parcels_surveyNo")}</th>
                <th>{t("parcels_village")}</th>
                <th>{t("parcels_classification")}</th>
                <th>{t("properties_area")}</th>
                <th>{t("common_status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.surveyNo}</td>
                  <td>{p.village}, {p.district}</td>
                  <td>{p.classification}</td>
                  <td>{p.areaSqft.toLocaleString()} sq.ft</td>
                  <td>
                    <span className={`badge ${p.boundaryVerified ? "badge-green" : "badge-gold"}`}>
                      {p.boundaryVerified ? t("docs_verified") : t("docs_pending")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

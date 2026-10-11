import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState } from "../components/Feedback.jsx";
import DigitalDeedModal from "../components/DigitalDeedModal.jsx";

export default function Properties() {
  const { t, user } = useApp();
  const { data, loading, error, reload } = useAsync(() => api.properties.list(), [user?.id]);
  const { data: recentlyViewed } = useAsync(() => api.properties.getRecentlyViewed(), [user?.id]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [activeDeed, setActiveDeed] = useState(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        (p.deedNumber && p.deedNumber.toLowerCase().includes(search.toLowerCase()));
      const matchesType = type === "all" || p.type === type;
      return matchesSearch && matchesType;
    });
  }, [data, search, type]);

  async function handleViewProperty(property) {
    // Calling get triggers recently viewed tracking in backend
    try {
      await api.properties.get(property.id);
    } catch {
      /* ignore */
    }

    if (property.deedNumber) {
      try {
        const deed = await api.deeds.getByNumber(property.deedNumber);
        setActiveDeed(deed);
      } catch {
        // Fallback construct deed from property
        setActiveDeed({
          deedNumber: property.deedNumber,
          propertyTitle: property.title,
          propertyType: property.type,
          areaSqft: property.areaSqft,
          address: property.address,
          ownerName: property.ownerName,
          coordinates: property.coordinates,
          issueDate: property.registeredOn || new Date(),
        });
      }
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{user?.role === "citizen" ? "My Properties" : t("properties_title")}</h1>
          <p className="page-desc">
            {user?.role === "citizen"
              ? "Cadastral land parcels and registered property titles linked to your citizen account."
              : t("properties_desc")}
          </p>
        </div>
        {user?.role === "citizen" && (
          <Link to="/app/registration" className="btn btn-primary">{t("properties_new")}</Link>
        )}
      </div>

      {/* Recently Viewed Section (Requirement 6) */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.1rem" }}>🕒</span>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)" }}>Recently Viewed Properties</h3>
          </div>
          <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "8px" }}>
            {recentlyViewed.map((rp) => (
              <div
                key={rp.id}
                onClick={() => handleViewProperty(rp)}
                style={{
                  minWidth: "220px",
                  padding: "12px 14px",
                  background: "var(--paper-soft)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {rp.title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                  {rp.id} &bull; {rp.type}
                </div>
                {rp.deedNumber && (
                  <div style={{ fontSize: "0.72rem", color: "var(--green-700)", fontWeight: 600, marginTop: "4px" }}>
                    📜 {rp.deedNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filter-bar">
        <input placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">{t("common_all")}</option>
          <option value="Residential">Residential</option>
          <option value="Agricultural">Agricultural</option>
          <option value="Commercial">Commercial</option>
          <option value="Industrial">Industrial</option>
        </select>
      </div>

      {loading && <Loader />}
      {error && <ErrorState onRetry={reload} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          description={
            user?.role === "citizen"
              ? "You do not have any registered properties under your citizen account yet. Submit a registration application to get started."
              : "No properties match your current filter criteria."
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid cols-3">
          {filtered.map((p) => (
            <div className="card record-card" key={p.id}>
              <div className="card-seal">✓</div>
              <div className="record-card-top">
                <div>
                  <p className="card-title" style={{ marginBottom: 2 }}>{p.title}</p>
                  <p className="record-card-id">{p.id}</p>
                </div>
              </div>
              <div className="record-card-meta">
                <span><strong>{t("properties_propType")}:</strong> {p.type}</span>
                <span><strong>{t("properties_area")}:</strong> {p.areaSqft.toLocaleString()} sq.ft</span>
                <span><strong>{t("common_owner")}:</strong> {p.ownerName}</span>
                <span><strong>{t("common_location")}:</strong> {p.address}</span>
                {p.coordinates && (
                  <span>
                    <strong>GPS:</strong> {p.coordinates.lat?.toFixed(4)}° N, {p.coordinates.lng?.toFixed(4)}° E
                  </span>
                )}
                {p.deedNumber && (
                  <span style={{ color: "var(--green-700)" }}>
                    <strong>Deed No:</strong> {p.deedNumber}
                  </span>
                )}
              </div>

              <div style={{ marginTop: "14px", borderTop: "1px solid var(--line)", paddingTop: "10px", display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                {p.deedNumber ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewProperty(p)}
                    style={{ fontSize: "0.78rem" }}
                  >
                    📜 View Digital Deed &amp; QR
                  </button>
                ) : (
                  <Link to={`/track?ref=${p.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: "0.78rem" }}>
                    🔍 Track Verification
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Digital Deed Modal with QR & PDF */}
      {activeDeed && (
        <DigitalDeedModal deed={activeDeed} onClose={() => setActiveDeed(null)} />
      )}
    </div>
  );
}

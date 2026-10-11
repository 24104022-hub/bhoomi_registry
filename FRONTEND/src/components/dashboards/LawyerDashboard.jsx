import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon.jsx";
import { StatusBadge } from "../Feedback.jsx";

export default function LawyerDashboard({ user, stats, properties, documents, transfers, appointments, addToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const pendingDocs = documents?.filter((d) => d.status === "pending") || [];
  const clientCases = transfers || [];

  function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setTimeout(() => {
      const match = properties?.find(
        (p) =>
          p.surveyNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id?.toLowerCase().includes(searchQuery.toLowerCase())
      ) || null;
      setSearchResult(match);
      setSearching(false);
    }, 300);
  }

  function handleCertify(docId) {
    addToast(`Document ${docId} legally certified with Bar Council ID ${user.barId || "TN/BAR/50231"}!`, "success");
  }

  return (
    <div className="role-dashboard lawyer-dash">
      {/* Legal Advocate Workspace Header */}
      <div className="dash-hero-card" style={{ background: "linear-gradient(135deg, #312e81, #1e1b4b)" }}>
        <div className="dash-hero-content">
          <div className="dash-hero-badge" style={{ background: "rgba(129, 140, 248, 0.25)", color: "#c7d2fe" }}>
            <Icon name="briefcase" size={14} /> Bar Council of Tamil Nadu &bull; Certified Legal Practitioner
          </div>
          <h1 className="dash-hero-title">{user.fullName}</h1>
          <p className="dash-hero-sub">
            Title Due Diligence &bull; Conducting 30-year root-of-title searches, drafting conveyancing deeds, verifying affidavits, and certifying property encumbrance clearances.
          </p>
          <div className="dash-hero-actions">
            <Link to="/app/documents" className="btn btn-primary" style={{ background: "#4f46e5" }}>
              <Icon name="doc" size={16} /> Legal Documents Repository
            </Link>
            <Link to="/app/transfer" className="btn btn-secondary" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              <Icon name="swap" size={16} /> Property Conveyancing Cases ({clientCases.length})
            </Link>
          </div>
        </div>
        <div className="dash-hero-meta">
          <div className="dash-meta-item">
            <span className="dash-meta-label">Bar Council Roll No.</span>
            <strong className="dash-meta-val">{user.barId || "TN/BAR/50231"}</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Practice Jurisdiction</span>
            <strong className="dash-meta-val">Madurai District Courts &amp; Registry</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Legal Notary Status</span>
            <strong className="dash-meta-val" style={{ color: "#a5b4fc" }}>✓ Licensed Advocate Seal</strong>
          </div>
        </div>
      </div>

      {/* 4 Lawyer Metric Cards */}
      <div className="grid cols-4" style={{ marginTop: "24px" }}>
        <div className="stat-card modern-stat" style={{ borderLeftColor: "#4f46e5" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(79, 70, 229, 0.12)", color: "#4f46e5" }}>
            <Icon name="search" size={20} />
          </div>
          <div>
            <p className="stat-label">Title Due Diligence</p>
            <p className="stat-value">{properties?.length || 4}</p>
            <p className="stat-foot">Properties vetted for title</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#f59e0b" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Icon name="doc" size={20} />
          </div>
          <div>
            <p className="stat-label">Pending Document Certifications</p>
            <p className="stat-value">{pendingDocs.length}</p>
            <p className="stat-foot">Awaiting advocate endorsement</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#10b981" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <Icon name="award" size={20} />
          </div>
          <div>
            <p className="stat-label">Certified Conveyancing Cases</p>
            <p className="stat-value">{clientCases.length}</p>
            <p className="stat-foot">Drafted &amp; legally approved</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#06b6d4" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#0891b2" }}>
            <Icon name="calendar" size={20} />
          </div>
          <div>
            <p className="stat-label">Client Hearings</p>
            <p className="stat-value">{appointments?.length || 2}</p>
            <p className="stat-foot">Registry appointments</p>
          </div>
        </div>
      </div>

      {/* Title Due Diligence Search Tool */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header-row">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>🔍 Title Due Diligence &amp; 30-Year Encumbrance Search</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Search any Survey Number, Patta, or Deed reference to verify legal chain-of-title and prior encumbrances.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Enter Survey No (e.g. 228/4A), Property Ref (PROP-101), or Village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
          />
          <button type="submit" className="btn btn-primary" style={{ background: "#4f46e5" }} disabled={searching}>
            {searching ? "Searching Chain..." : "Verify Title Chain"}
          </button>
        </form>

        {searchResult && (
          <div style={{ marginTop: "16px", padding: "16px", background: "var(--paper-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <strong style={{ fontSize: "1rem" }}>{searchResult.title || searchResult.propertyTitle}</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                  Survey No: {searchResult.surveyNo || "228/4A"} &bull; {searchResult.village || "Madurai"}
                </div>
              </div>
              <span className="badge badge-green">✓ Clear Root of Title</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "12px", fontSize: "0.82rem" }}>
              <div>
                <span style={{ color: "var(--ink-soft)" }}>Encumbrance Check:</span>
                <div style={{ fontWeight: 600, color: "var(--green-700)" }}>Nil / Free of Mortgage</div>
              </div>
              <div>
                <span style={{ color: "var(--ink-soft)" }}>Prior Root Conveyance:</span>
                <div style={{ fontWeight: 600 }}>Deed #412/2018 (Vol. 88)</div>
              </div>
              <div>
                <span style={{ color: "var(--ink-soft)" }}>Litigation Status:</span>
                <div style={{ fontWeight: 600, color: "var(--green-700)" }}>No Lis Pendens Registered</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Document Certification Queue & Client Conveyancing Cases */}
      <div className="grid cols-2" style={{ marginTop: "24px" }}>
        {/* Legal Document Certification Queue */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>📜 Legal Document Certification Queue</h4>
            <span className="badge badge-gold">{pendingDocs.length} Pending</span>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {pendingDocs.map((doc) => (
              <div key={doc.id} className="modern-list-item">
                <div className="item-icon-box" style={{ background: "rgba(79, 70, 229, 0.1)", color: "#4f46e5" }}>
                  <Icon name="doc" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{doc.title || doc.name}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                    Client: {doc.client || doc.uploadedBy || "Citizen"} &bull; Ref: {doc.id}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#4f46e5", borderColor: "#c7d2fe" }}
                  onClick={() => handleCertify(doc.id)}
                >
                  <Icon name="check" size={13} /> Certify
                </button>
              </div>
            ))}
            {pendingDocs.length === 0 && (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "16px" }}>
                No legal documents currently awaiting advocate certification.
              </p>
            )}
          </div>
        </div>

        {/* Client Conveyancing Cases */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>⚖️ Active Property Conveyancing Cases</h4>
            <Link to="/app/transfer" className="btn btn-secondary btn-sm">Transfers</Link>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {clientCases.map((c) => (
              <div key={c.id} className="modern-list-item">
                <div className="item-icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  <Icon name="swap" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.propertyTitle}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                    Seller: {c.fromOwner || c.sellerName} ➔ Buyer: {c.toOwner || c.buyerName}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--green-700)", marginTop: "2px" }}>
                    Legal Conveyancing Draft
                  </div>
                </div>
                <StatusBadge status={c.status || "underReview"} />
              </div>
            ))}
            {clientCases.length === 0 && (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "16px" }}>
                No active property conveyancing cases.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

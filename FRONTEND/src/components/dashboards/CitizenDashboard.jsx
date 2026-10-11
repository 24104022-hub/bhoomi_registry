import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon.jsx";
import { StatusBadge } from "../Feedback.jsx";
import DigitalDeedModal from "../DigitalDeedModal.jsx";

export default function CitizenDashboard({ user, stats, registrations, properties, deeds, appointments, notifications }) {
  const [selectedDeed, setSelectedDeed] = useState(null);
  const [trackRef, setTrackRef] = useState("");

  const citizenRegs = registrations?.filter((r) => r.applicantId === user?.id || r.applicantEmail === user?.email) || [];
  const citizenProperties = properties?.filter((p) => p.ownerId === user?.id || p.ownerEmail === user?.email) || [];
  const activeReg = citizenRegs.find((r) => r.status !== "approved" && r.status !== "rejected") || citizenRegs[0];

  return (
    <div className="role-dashboard citizen-dash">
      {/* Hero Welcome Banner */}
      <div className="dash-hero-card">
        <div className="dash-hero-content">
          <div className="dash-hero-badge">
            <Icon name="shield" size={14} /> Citizen Portal &bull; Verified ID
          </div>
          <h1 className="dash-hero-title">Welcome back, {user.fullName}</h1>
          <p className="dash-hero-sub">
            Manage your registered land parcels, track pending deed applications, and access certified legal documents from the Tamil Nadu Bhoomi Registry.
          </p>
          <div className="dash-hero-actions">
            <Link to="/app/registration" className="btn btn-primary">
              <Icon name="file-plus" size={16} /> Register New Property
            </Link>
            <Link to="/app/transfer" className="btn btn-secondary">
              <Icon name="swap" size={16} /> Transfer Ownership
            </Link>
            <Link to="/track" className="btn btn-ghost" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
              <Icon name="search" size={16} /> Track Status
            </Link>
          </div>
        </div>
        <div className="dash-hero-meta">
          <div className="dash-meta-item">
            <span className="dash-meta-label">Citizen ID</span>
            <strong className="dash-meta-val">{user.id || "Citizen"}</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Account Email</span>
            <strong className="dash-meta-val" style={{ color: "var(--green-600)" }}>{user.email}</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Registered Phone</span>
            <strong className="dash-meta-val">{user.phone || "Not Provided"}</strong>
          </div>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid cols-4" style={{ marginTop: "24px" }}>
        <div className="stat-card modern-stat">
          <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
            <Icon name="home" size={20} />
          </div>
          <div>
            <p className="stat-label">My Properties</p>
            <p className="stat-value">{citizenProperties.length}</p>
            <p className="stat-foot">Cadastral holdings recorded</p>
          </div>
        </div>

        <div className="stat-card modern-stat">
          <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Icon name="clock" size={20} />
          </div>
          <div>
            <p className="stat-label">Applications Active</p>
            <p className="stat-value">{citizenRegs.filter((r) => r.status !== "approved" && r.status !== "rejected").length}</p>
            <p className="stat-foot">Under official review</p>
          </div>
        </div>

        <div className="stat-card modern-stat">
          <div className="stat-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
            <Icon name="award" size={20} />
          </div>
          <div>
            <p className="stat-label">Digital Title Deeds</p>
            <p className="stat-value">{citizenProperties.filter((p) => p.deedNumber).length}</p>
            <p className="stat-foot">Cryptographically sealed</p>
          </div>
        </div>

        <div className="stat-card modern-stat">
          <div className="stat-icon-wrap" style={{ background: "rgba(156, 163, 175, 0.12)", color: "#4b5563" }}>
            <Icon name="wallet" size={20} />
          </div>
          <div>
            <p className="stat-label">Fee Payments</p>
            <p className="stat-value">₹{stats?.duePayments ? (stats.duePayments * 1500).toLocaleString("en-IN") : "0"}</p>
            <p className="stat-foot">Stamp duty &amp; registration</p>
          </div>
        </div>
      </div>

      {/* Active Application Journey Tracker */}
      {activeReg && (
        <div className="card timeline-card" style={{ marginTop: "24px" }}>
          <div className="card-header-row">
            <div>
              <span className="card-badge-pill">Application Journey</span>
              <h3 style={{ margin: "4px 0 0", fontSize: "1.1rem" }}>
                {activeReg.propertyTitle || "Urban Residential Plot"} &bull; Ref #{activeReg.id}
              </h3>
            </div>
            <StatusBadge status={activeReg.status} />
          </div>

          <div className="journey-tracker">
            <div className={`journey-step ${activeReg.status ? "completed" : "active"}`}>
              <div className="step-circle">1</div>
              <div className="step-content">
                <strong>Submission &amp; Upload</strong>
                <span>Documents &amp; KYC verified</span>
              </div>
            </div>

            <div className="journey-line completed" />

            <div className={`journey-step ${["surveyVerified", "underReview", "approved"].includes(activeReg.status) ? "completed" : "active"}`}>
              <div className="step-circle">2</div>
              <div className="step-content">
                <strong>Cadastral Survey</strong>
                <span>Boundary ground verification</span>
              </div>
            </div>

            <div className="journey-line" />

            <div className={`journey-step ${["underReview", "approved"].includes(activeReg.status) ? "completed" : ""}`}>
              <div className="step-circle">3</div>
              <div className="step-content">
                <strong>Sub-Registrar Adjudication</strong>
                <span>Title clearance &amp; Stamp duty</span>
              </div>
            </div>

            <div className="journey-line" />

            <div className={`journey-step ${activeReg.status === "approved" ? "completed" : ""}`}>
              <div className="step-circle">4</div>
              <div className="step-content">
                <strong>Digital Deed Granted</strong>
                <span>Cryptographic seal &amp; QR issued</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Properties & Certified Documents */}
      <div className="grid cols-2" style={{ marginTop: "24px" }}>
        {/* My Registered Properties */}
        <div className="card">
          <div className="card-header-row">
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>🏡 My Registered Properties</h3>
            <Link to="/app/properties" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {citizenProperties.map((p) => (
              <div key={p.id} className="modern-list-item">
                <div className="item-icon-box">
                  <Icon name="building" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--ink)" }}>{p.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                    Survey No: <strong>{p.surveyNo || "228/4A"}</strong> &bull; {p.areaSqft ? `${p.areaSqft} sq.ft` : "Residential"} &bull; {p.village || "Madurai"}
                  </div>
                </div>
                {p.deedNumber ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedDeed({ deedNumber: p.deedNumber, propertyTitle: p.title, ...p })}
                  >
                    <Icon name="doc" size={14} /> View Deed
                  </button>
                ) : (
                  <span className="badge badge-green">Registered</span>
                )}
              </div>
            ))}
            {citizenProperties.length === 0 && (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "16px" }}>
                No properties registered under this account yet. Click "Register New Property" to get started.
              </p>
            )}
          </div>
        </div>

        {/* Legal Documents Vault & Quick Tracking */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Quick Tracking Widget */}
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(35, 78, 46, 0.05), rgba(176, 138, 62, 0.08))" }}>
            <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>🔍 Instant Application Search</h4>
            <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Enter any Deed Number or Application Reference to inspect registry status:
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (trackRef.trim()) window.location.href = `/track?ref=${encodeURIComponent(trackRef.trim())}`;
              }}
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="text"
                placeholder="e.g. DEED-2026-MAD-001 or REG-1029"
                value={trackRef}
                onChange={(e) => setTrackRef(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>
          </div>

          {/* Certified Documents Vault */}
          <div className="card">
            <div className="card-header-row">
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>📜 Certified Legal Documents</h4>
              <Link to="/app/documents" style={{ fontSize: "0.8rem", color: "var(--green-700)", textDecoration: "none", fontWeight: 600 }}>Vault</Link>
            </div>
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="doc-pill-item">
                <Icon name="doc" size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Official Digital Title Deed (Form-1)</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Cryptographically validated &bull; PDF + QR</div>
                </div>
                <Link to="/app/documents" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
                  <Icon name="download" size={14} />
                </Link>
              </div>

              <div className="doc-pill-item">
                <Icon name="award" size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Cadastral Boundary Survey Map</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Licensed Surveyor Certified &bull; Geo-tagged</div>
                </div>
                <Link to="/app/land-parcels" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
                  <Icon name="external" size={14} />
                </Link>
              </div>

              <div className="doc-pill-item">
                <Icon name="shield" size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Encumbrance Certificate (EC 30-Year)</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Clear Title Free of Liabilities</div>
                </div>
                <Link to="/app/documents" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
                  <Icon name="download" size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedDeed && (
        <DigitalDeedModal deed={selectedDeed} onClose={() => setSelectedDeed(null)} />
      )}
    </div>
  );
}

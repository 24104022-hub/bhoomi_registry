import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon.jsx";
import { StatusBadge } from "../Feedback.jsx";
import Modal from "../Modal.jsx";

export default function SurveyorDashboard({ user, stats, registrations, parcels, reload, addToast, api }) {
  const [selectedReg, setSelectedReg] = useState(null);
  const [verified, setVerified] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [gpsVerified, setGpsVerified] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const pendingSurveys = registrations?.filter((r) => r.status === "pending" || r.status === "surveyorReview") || [];
  const completedSurveys = registrations?.filter((r) => r.status === "surveyVerified" || r.status === "underReview" || r.status === "approved") || [];

  async function handleVerifySubmit() {
    if (!selectedReg) return;
    setSubmitting(true);
    try {
      await api.surveyor.verifyBoundary(selectedReg.id, {
        boundaryVerified: verified,
        remarks: remarks || (verified ? "Cadastral field survey completed. Boundaries match revenue survey map." : "Boundary overlap detected. Notice issued."),
        surveyNo: selectedReg.surveyNo || "228/4A",
      });
      addToast(verified ? "Cadastral boundaries certified & sealed! Citizen notified via email." : "Survey discrepancy recorded & flagged.", verified ? "success" : "warning");
      setSelectedReg(null);
      setRemarks("");
      reload();
    } catch (err) {
      addToast(err.message || "Failed to submit survey verification.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="role-dashboard surveyor-dash">
      {/* Surveyor Station Header */}
      <div className="dash-hero-card" style={{ background: "linear-gradient(135deg, #134e4a, #065f46)" }}>
        <div className="dash-hero-content">
          <div className="dash-hero-badge" style={{ background: "rgba(20, 184, 166, 0.25)", color: "#99f6e4" }}>
            <Icon name="compass" size={14} /> Directorate of Survey &amp; Land Records &bull; Licensed Field Officer
          </div>
          <h1 className="dash-hero-title">{user.fullName}</h1>
          <p className="dash-hero-sub">
            Cadastral Field Station &bull; Conducting ground boundary verification, GPS coordinate polygon mapping, and legal revenue sketch certification.
          </p>
          <div className="dash-hero-actions">
            <Link to="/app/land-parcels" className="btn btn-primary" style={{ background: "#0d9488", color: "#fff" }}>
              <Icon name="map" size={16} /> Open GIS Cadastral Map
            </Link>
            <Link to="/app/appointments" className="btn btn-secondary" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              <Icon name="calendar" size={16} /> Field Inspection Visits ({stats?.appointments || 2})
            </Link>
          </div>
        </div>
        <div className="dash-hero-meta">
          <div className="dash-meta-item">
            <span className="dash-meta-label">Surveyor License #</span>
            <strong className="dash-meta-val">{user.license || "TN-SUR-2291"}</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Assigned Jurisdiction</span>
            <strong className="dash-meta-val">Madurai Revenue Division</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Field Equipment</span>
            <strong className="dash-meta-val" style={{ color: "#6ee7b7" }}>✓ DGPS &amp; ETS Calibrated</strong>
          </div>
        </div>
      </div>

      {/* 4 Surveyor Metric Cards */}
      <div className="grid cols-4" style={{ marginTop: "24px" }}>
        <div className="stat-card modern-stat" style={{ borderLeftColor: "#0d9488" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(13, 148, 136, 0.12)", color: "#0d9488" }}>
            <Icon name="compass" size={20} />
          </div>
          <div>
            <p className="stat-label">Pending Field Surveys</p>
            <p className="stat-value">{pendingSurveys.length}</p>
            <p className="stat-foot">Awaiting on-site verification</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#10b981" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <Icon name="shield" size={20} />
          </div>
          <div>
            <p className="stat-label">Certified Parcels</p>
            <p className="stat-value">{completedSurveys.length}</p>
            <p className="stat-foot">Boundaries confirmed &amp; sealed</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#3b82f6" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
            <Icon name="map" size={20} />
          </div>
          <div>
            <p className="stat-label">GIS Cadastral Parcels</p>
            <p className="stat-value">{parcels?.length || 0}</p>
            <p className="stat-foot">Digitized polygon records</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#f59e0b" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Icon name="calendar" size={20} />
          </div>
          <div>
            <p className="stat-label">Scheduled Visits</p>
            <p className="stat-value">{stats?.appointments || 0}</p>
            <p className="stat-foot">Citizen on-site inspections</p>
          </div>
        </div>
      </div>

      {/* Main Inspection Queue Table */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header-row">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>📐 Assigned Boundary Inspection Queue</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Inspect and verify boundary markers. Submitting verification notifies the citizen and advances to Sub-Registrar review.
            </p>
          </div>
          <span className="badge badge-gold">{pendingSurveys.length} Awaiting Action</span>
        </div>

        <div className="table-wrap" style={{ marginTop: "14px" }}>
          <table className="ledger">
            <thead>
              <tr>
                <th>App Reference</th>
                <th>Property Title</th>
                <th>Survey Number</th>
                <th>Extent Area</th>
                <th>Citizen Applicant</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingSurveys.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.id}</strong></td>
                  <td>{r.propertyTitle}</td>
                  <td><span className="badge badge-neutral">{r.surveyNo || "228/4A"}</span></td>
                  <td>{r.areaSqft ? `${r.areaSqft} sq.ft` : "5,400 sq.ft"}</td>
                  <td>{r.applicantName}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ background: "#0d9488" }}
                      onClick={() => {
                        setSelectedReg(r);
                        setVerified(true);
                        setRemarks("");
                      }}
                    >
                      <Icon name="compass" size={14} /> Verify Boundaries
                    </button>
                  </td>
                </tr>
              ))}
              {pendingSurveys.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-soft)", padding: "24px" }}>
                    🎉 All assigned cadastral surveys are completed! No pending applications in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GIS Cadastral Parcels Preview & Completed Inspection Log */}
      <div className="grid cols-2" style={{ marginTop: "24px" }}>
        {/* Cadastral Parcels Registry */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>🗺️ Cadastral Land Parcels (GIS)</h4>
            <Link to="/app/land-parcels" className="btn btn-secondary btn-sm">Interactive Map</Link>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {(parcels || []).slice(0, 3).map((p) => (
              <div key={p.id} className="modern-list-item">
                <div className="item-icon-box" style={{ background: "rgba(13, 148, 136, 0.1)", color: "#0d9488" }}>
                  <Icon name="map" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Survey #{p.surveyNo} &bull; {p.village}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                    Extent: {p.areaSqft} sq.ft &bull; Parcel ID: {p.id}
                  </div>
                </div>
                <span className={`badge ${p.boundaryVerified ? "badge-green" : "badge-gold"}`}>
                  {p.boundaryVerified ? "✓ Verified" : "Pending Inspection"}
                </span>
              </div>
            ))}
            {(!parcels || parcels.length === 0) && (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "16px" }}>
                No cadastral land parcels registered in this division yet.
              </p>
            )}
          </div>
        </div>

        {/* Survey History Log */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>📋 Completed Survey Certifications</h4>
            <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Official Record</span>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {completedSurveys.slice(0, 3).map((c) => (
              <div key={c.id} className="modern-list-item">
                <div className="item-icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  <Icon name="check" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.propertyTitle}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                    Ref #{c.id} &bull; Applicant: {c.applicantName}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--green-700)", marginTop: "2px" }}>
                    "Cadastral boundaries verified &amp; sealed."
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
            {completedSurveys.length === 0 && (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "16px" }}>
                Completed inspection logs will appear here.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Boundary Verification Modal */}
      {selectedReg && (
        <Modal
          title={`Cadastral Boundary Certification — ${selectedReg.id}`}
          onClose={() => setSelectedReg(null)}
        >
          <div>
            <div style={{ padding: "12px", background: "var(--paper-soft)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>{selectedReg.propertyTitle}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "3px" }}>
                Survey No: <strong>{selectedReg.surveyNo || "228/4A"}</strong> &bull; Extent: <strong>{selectedReg.areaSqft || 5400} sq.ft</strong> &bull; Applicant: {selectedReg.applicantName}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, fontSize: "0.92rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
                Certify that physical ground boundary markers align with the revenue sketch
              </label>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", cursor: "pointer", color: "var(--ink-soft)" }}>
                <input
                  type="checkbox"
                  checked={gpsVerified}
                  onChange={(e) => setGpsVerified(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
                DGPS Coordinates Verified (Latitude 9.8789° N, Longitude 78.0716° E)
              </label>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                Surveyor Field Remarks &amp; Certification Note
              </label>
              <textarea
                rows={3}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-strong)", fontFamily: "inherit" }}
                placeholder="e.g. Cadastral field survey completed. Boundary corners demarcated without overlap."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReg(null)} disabled={submitting}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: verified ? "#0d9488" : "var(--maroon-700)" }}
                onClick={handleVerifySubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting Certification..." : verified ? "Certify Boundaries & Notify Citizen" : "Flag Discrepancy"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

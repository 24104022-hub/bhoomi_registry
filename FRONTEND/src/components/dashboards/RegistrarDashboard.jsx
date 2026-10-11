import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon.jsx";
import { StatusBadge } from "../Feedback.jsx";
import Modal from "../Modal.jsx";
import DigitalDeedModal from "../DigitalDeedModal.jsx";

export default function RegistrarDashboard({ user, stats, registrations, deeds, appointments, transfers, reload, addToast, api }) {
  const [actionModal, setActionModal] = useState(null); // application item
  const [actionType, setActionType] = useState("approve"); // "approve" | "reject"
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewDeed, setViewDeed] = useState(null);

  // Property Transfer Adjudication State
  const [transferModal, setTransferModal] = useState(null); // transfer item
  const [transferActionType, setTransferActionType] = useState("approve"); // "approve" | "reject"
  const [transferRemarks, setTransferRemarks] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Applications ready for Sub-Registrar adjudication
  const adjudicationQueue = registrations?.filter((r) => r.status === "surveyVerified" || r.status === "underReview" || r.status === "pending") || [];
  const pendingTransfers = transfers?.filter((t) => t.status === "underReview" || t.status === "pending") || [];
  const issuedDeeds = deeds || [];
  const hearingAppts = appointments || [];

  async function handleActionSubmit() {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      if (actionType === "approve") {
        const res = await api.registrar.approve(actionModal.id, {
          remarks: remarks || "Admitted into State Land Registry and digital title deed granted.",
          office: user.office || "Madurai South Sub-Registrar Office",
        });
        addToast(`Title Deed issued! Citizen notified via email. Deed Number: ${res.deed?.deedNumber || "Generated"}`);
        if (res.deed) setViewDeed(res.deed);
      } else {
        await api.registrar.reject(actionModal.id, {
          remarks: remarks || "Application rejected due to document inconsistency or encumbrance liability.",
        });
        addToast("Application rejected. Formal notification sent to applicant.", "warning");
      }
      setActionModal(null);
      setRemarks("");
      reload();
    } catch (err) {
      addToast(err.message || "Failed to process adjudication action.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransferActionSubmit() {
    if (!transferModal) return;
    setTransferSubmitting(true);
    try {
      if (transferActionType === "approve") {
        await api.transfers.approve(transferModal.id, {
          remarks: transferRemarks || "Ownership transfer conveyance approved by Sub-Registrar. Land title officially reassigned in State Registry.",
        });
        addToast(`Transfer ${transferModal.id} approved! Title re-assigned and both parties notified via email.`);
      } else {
        await api.transfers.reject(transferModal.id, {
          remarks: transferRemarks || "Ownership transfer rejected by Sub-Registrar.",
        });
        addToast(`Transfer ${transferModal.id} rejected. Formal notice dispatched to both parties.`, "warning");
      }
      setTransferModal(null);
      setTransferRemarks("");
      reload();
    } catch (err) {
      addToast(err.message || "Failed to process transfer adjudication.", "error");
    } finally {
      setTransferSubmitting(false);
    }
  }

  return (
    <div className="role-dashboard registrar-dash">
      {/* Sub-Registrar Desk Header */}
      <div className="dash-hero-card" style={{ background: "linear-gradient(135deg, #1e3a8a, #1e293b)" }}>
        <div className="dash-hero-content">
          <div className="dash-hero-badge" style={{ background: "rgba(59, 130, 246, 0.25)", color: "#93c5fd" }}>
            <Icon name="shield" size={14} /> Sub-Registrar Judicial Adjudication Desk &bull; Legal Authority
          </div>
          <h1 className="dash-hero-title">{user.fullName}</h1>
          <p className="dash-hero-sub">
            Reviewing verified cadastral boundary surveys, admitting valid conveyances into the Tamil Nadu State Register, and issuing cryptographic Form-1 Title Deeds.
          </p>
          <div className="dash-hero-actions">
            <Link to="/app/registration" className="btn btn-primary" style={{ background: "#2563eb" }}>
              <Icon name="file-plus" size={16} /> All Registration Applications
            </Link>
            <Link to="/app/transfer" className="btn btn-secondary" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              <Icon name="swap" size={16} /> Transfer Conveyances ({pendingTransfers.length})
            </Link>
            <Link to="/app/appointments" className="btn btn-secondary" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              <Icon name="calendar" size={16} /> Hearing Appointments ({hearingAppts.length})
            </Link>
          </div>
        </div>
        <div className="dash-hero-meta">
          <div className="dash-meta-item">
            <span className="dash-meta-label">Sub-Registrar Office</span>
            <strong className="dash-meta-val">{user.office || "Madurai South Sub-Registrar Office"}</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Statutory Authority</span>
            <strong className="dash-meta-val" style={{ color: "#93c5fd" }}>Registration Act, 1908 (Sec. 52)</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Digital Seal Status</span>
            <strong className="dash-meta-val" style={{ color: "#6ee7b7" }}>✓ Active &bull; SHA-256 e-Sign</strong>
          </div>
        </div>
      </div>

      {/* 5 Registrar Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "24px" }}>
        <div className="stat-card modern-stat" style={{ borderLeftColor: "#2563eb" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}>
            <Icon name="file-text" size={20} />
          </div>
          <div>
            <p className="stat-label">Pending Registrations</p>
            <p className="stat-value">{adjudicationQueue.length}</p>
            <p className="stat-foot">Awaiting deed issue</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#0284c7" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(2, 132, 199, 0.12)", color: "#0284c7" }}>
            <Icon name="swap" size={20} />
          </div>
          <div>
            <p className="stat-label">Pending Transfers</p>
            <p className="stat-value">{pendingTransfers.length}</p>
            <p className="stat-foot">Conveyances to approve</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#10b981" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <Icon name="check" size={20} />
          </div>
          <div>
            <p className="stat-label">Survey-Certified Ready</p>
            <p className="stat-value">{registrations?.filter((r) => r.status === "surveyVerified").length || 0}</p>
            <p className="stat-foot">Ready for instant deed issue</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#f59e0b" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Icon name="award" size={20} />
          </div>
          <div>
            <p className="stat-label">Digital Deeds Issued</p>
            <p className="stat-value">{stats?.deeds || issuedDeeds.length || 0}</p>
            <p className="stat-foot">Recorded in State Archives</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#8b5cf6" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
            <Icon name="calendar" size={20} />
          </div>
          <div>
            <p className="stat-label">Today's Hearings</p>
            <p className="stat-value">{hearingAppts.length}</p>
            <p className="stat-foot">Biometric &amp; ID execution</p>
          </div>
        </div>
      </div>

      {/* Priority Adjudication Queue */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header-row">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>🏛️ Adjudication &amp; Digital Title Deed Issuance Queue</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Applications verified by licensed surveyors. Review valuation, confirm stamp duty, and issue cryptographic Form-1 deeds.
            </p>
          </div>
          <span className="badge badge-blue">{adjudicationQueue.length} In Queue</span>
        </div>

        <div className="table-wrap" style={{ marginTop: "14px" }}>
          <table className="ledger">
            <thead>
              <tr>
                <th>Application Ref</th>
                <th>Property Title</th>
                <th>Declared Value</th>
                <th>Citizen Applicant</th>
                <th>Survey Verification</th>
                <th>Adjudication Action</th>
              </tr>
            </thead>
            <tbody>
              {adjudicationQueue.map((r) => {
                const isSurveyDone = r.status === "surveyVerified" || r.status === "underReview";
                return (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong></td>
                    <td>{r.propertyTitle}</td>
                    <td>₹{Number(r.estValue || 4500000).toLocaleString("en-IN")}</td>
                    <td>{r.applicantName}</td>
                    <td>
                      {isSurveyDone ? (
                        <span className="badge badge-green">✓ Survey Certified</span>
                      ) : (
                        <span className="badge badge-gold">Survey in Progress</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ background: "#2563eb" }}
                          onClick={() => {
                            setActionModal(r);
                            setActionType("approve");
                            setRemarks("");
                          }}
                        >
                          Approve &amp; Issue Deed
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--maroon-700)" }}
                          onClick={() => {
                            setActionModal(r);
                            setActionType("reject");
                            setRemarks("");
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {adjudicationQueue.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-soft)", padding: "24px" }}>
                    No applications currently awaiting Sub-Registrar adjudication. All deeds processed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property Conveyance & Ownership Transfer Adjudication Queue */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header-row">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>🏛️ Property Conveyance &amp; Ownership Transfer Adjudication Queue</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Citizens' requests to transfer title ownership. Sub-Registrar approval officially reassigns ownership in the State Ledger and notifies both parties.
            </p>
          </div>
          <span className="badge badge-blue">{pendingTransfers.length} Pending Conveyances</span>
        </div>

        <div className="table-wrap" style={{ marginTop: "14px" }}>
          <table className="ledger">
            <thead>
              <tr>
                <th>Transfer Ref</th>
                <th>Property</th>
                <th>Transferor (Seller)</th>
                <th>Transferee (Buyer)</th>
                <th>Conveyance Type</th>
                <th>Adjudication Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingTransfers.map((tr) => (
                <tr key={tr.id}>
                  <td><strong>{tr.id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tr.propertyTitle || tr.propertyId}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>Property ID: {tr.propertyId}</div>
                  </td>
                  <td>
                    <div>{tr.fromOwner}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>{tr.fromOwnerEmail}</div>
                  </td>
                  <td>
                    <div>{tr.toOwner}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>{tr.toEmail}</div>
                  </td>
                  <td>
                    <span className="badge badge-gold">{tr.transferType || "Sale"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ background: "#2563eb" }}
                        onClick={() => {
                          setTransferModal(tr);
                          setTransferActionType("approve");
                          setTransferRemarks("");
                        }}
                      >
                        Approve Conveyance
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--maroon-700)" }}
                        onClick={() => {
                          setTransferModal(tr);
                          setTransferActionType("reject");
                          setTransferRemarks("");
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingTransfers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-soft)", padding: "24px" }}>
                    No property conveyance transfers currently awaiting Sub-Registrar adjudication. All transfers processed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Issued Deeds Registry & In-Person Verification Appointments */}
      <div className="grid cols-2" style={{ marginTop: "24px" }}>
        {/* Recently Issued Deeds Register */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>📜 Registered Title Deeds (Form-1)</h4>
            <Link to="/app/documents" className="btn btn-secondary btn-sm">Deeds Archive</Link>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {issuedDeeds.slice(0, 3).map((d) => (
              <div key={d.id || d.deedNumber} className="modern-list-item">
                <div className="item-icon-box" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                  <Icon name="award" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.deedNumber || "DEED-2026-MAD-001"}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                    Grantee: {d.ownerName || d.buyerName || d.applicantName || "Grantee"} &bull; Ref: {d.propertyId || "Property"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontFamily: "monospace", marginTop: "2px" }}>
                    SHA-256: {d.documentHash ? `${d.documentHash.slice(0, 16)}...` : "e4a7b92c10f8..."}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewDeed(d)}
                >
                  Inspect
                </button>
              </div>
            ))}
            {issuedDeeds.length === 0 && (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "16px" }}>
                No deeds issued yet today.
              </p>
            )}
          </div>
        </div>

        {/* Verification Hearings Schedule */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>📅 Today's Biometric &amp; Legal Hearings</h4>
            <Link to="/app/appointments" className="btn btn-secondary btn-sm">Full Calendar</Link>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {hearingAppts.slice(0, 3).map((a) => (
              <div key={a.id} className="modern-list-item">
                <div className="item-icon-box" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                  <Icon name="calendar" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.purpose || "Deed Execution & Biometrics"}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                    {a.citizenName || a.applicantName || "Karthik Raman"} &bull; Slot: {a.timeSlot || "11:30 AM"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--green-700)", marginTop: "2px" }}>
                    Location: Sub-Registrar Chamber A
                  </div>
                </div>
                <StatusBadge status={a.status || "scheduled"} />
              </div>
            ))}
            {hearingAppts.length === 0 && (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "16px" }}>
                No hearings scheduled for today.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Adjudication Action Modal */}
      {actionModal && (
        <Modal
          title={`Sub-Registrar Adjudication — ${actionModal.id}`}
          onClose={() => setActionModal(null)}
        >
          <div>
            <div style={{ padding: "12px", background: "var(--paper-soft)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>{actionModal.propertyTitle}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "4px" }}>
                Applicant: <strong>{actionModal.applicantName}</strong> &bull; Extent: <strong>{actionModal.areaSqft || 5400} sq.ft</strong> &bull; Valuation: ₹{Number(actionModal.estValue || 4500000).toLocaleString("en-IN")}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>
                Action Decision
              </label>
              <div style={{ display: "flex", gap: "14px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="actionType"
                    value="approve"
                    checked={actionType === "approve"}
                    onChange={() => setActionType("approve")}
                  />
                  Approve &amp; Grant Digital Title Deed
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--maroon-700)", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="actionType"
                    value="reject"
                    checked={actionType === "reject"}
                    onChange={() => setActionType("reject")}
                  />
                  Reject Application
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                Sub-Registrar Official Order &amp; Endorsement Remarks
              </label>
              <textarea
                rows={3}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-strong)", fontFamily: "inherit" }}
                placeholder={actionType === "approve" ? "e.g. Admitted to registration. Stamp duty verified. Deed granted." : "e.g. Inconsistent boundary sketch. Notice served under Section 58."}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn btn-secondary" onClick={() => setActionModal(null)} disabled={submitting}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: actionType === "approve" ? "#2563eb" : "var(--maroon-700)" }}
                onClick={handleActionSubmit}
                disabled={submitting}
              >
                {submitting ? "Processing..." : actionType === "approve" ? "Issue Official Title Deed" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transfer Adjudication Action Modal */}
      {transferModal && (
        <Modal
          title={`Sub-Registrar Adjudication — Conveyance ${transferModal.id}`}
          onClose={() => setTransferModal(null)}
        >
          <div>
            <div style={{ padding: "12px", background: "var(--paper-soft)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>{transferModal.propertyTitle || transferModal.propertyId}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "4px", lineHeight: "1.5" }}>
                Current Owner: <strong>{transferModal.fromOwner}</strong> ({transferModal.fromOwnerEmail})<br />
                New Owner: <strong>{transferModal.toOwner}</strong> ({transferModal.toEmail})<br />
                Conveyance Type: <strong>{transferModal.transferType || "Sale"}</strong>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>
                Action Decision
              </label>
              <div style={{ display: "flex", gap: "14px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="transferActionType"
                    value="approve"
                    checked={transferActionType === "approve"}
                    onChange={() => setTransferActionType("approve")}
                  />
                  Approve Conveyance &amp; Reassign Title
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--maroon-700)", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="transferActionType"
                    value="reject"
                    checked={transferActionType === "reject"}
                    onChange={() => setTransferActionType("reject")}
                  />
                  Reject Conveyance
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                Sub-Registrar Official Order &amp; Endorsement Remarks
              </label>
              <textarea
                rows={3}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-strong)", fontFamily: "inherit" }}
                placeholder={transferActionType === "approve" ? "e.g. Verified consideration and identity. Title transferred in Land Ledger." : "e.g. Identity discrepancy or encumbrance liability. Transfer denied."}
                value={transferRemarks}
                onChange={(e) => setTransferRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn btn-secondary" onClick={() => setTransferModal(null)} disabled={transferSubmitting}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: transferActionType === "approve" ? "#2563eb" : "var(--maroon-700)" }}
                onClick={handleTransferActionSubmit}
                disabled={transferSubmitting}
              >
                {transferSubmitting ? "Processing..." : transferActionType === "approve" ? "Authorize Title Conveyance" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {viewDeed && (
        <DigitalDeedModal deed={viewDeed} onClose={() => setViewDeed(null)} />
      )}
    </div>
  );
}

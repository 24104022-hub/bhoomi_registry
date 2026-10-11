import React from "react";
import Icon from "./Icon.jsx";

const STAGES = [
  { id: "stage1", label: "Citizen Registration", description: "Land parcel application submitted with GPS coordinates & deed draft" },
  { id: "stage2", label: "Surveyor Field Verification", description: "Licensed Cadastral Surveyor inspection & boundary pegging" },
  { id: "stage3", label: "Document & Title Scrutiny", description: "Encumbrance check, Revenue patta, and legal certificate review" },
  { id: "stage4", label: "Sub-Registrar Adjudication", description: "Official hearing, stamp duty audit, and admission into State Register" },
  { id: "stage5", label: "Digital Deed Generation", description: "Cryptographically signed Title Deed with SHA-256 integrity seal" },
  { id: "stage6", label: "Public QR Verification Live", description: "Instant smartphone scanning & tamper-proof verification active" },
];

export default function VerificationTimeline({ record, onOpenDeed }) {
  if (!record) return null;

  const status = record.status || "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isSurveyVerified = status === "surveyVerified" || isApproved;
  const isUnderReview = status === "underReview" || isSurveyVerified;

  // Determine stage progress (0 to 5)
  let activeIndex = 0;
  if (isApproved) {
    activeIndex = 5;
  } else if (isRejected) {
    activeIndex = 3;
  } else if (isSurveyVerified) {
    activeIndex = 3;
  } else if (status === "surveyorReview") {
    activeIndex = 1;
  }

  const timelineEntries = record.timeline || [];

  return (
    <div className="card timeline-card" style={{ marginTop: "24px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--gold-600)" }}>🛡️</span> Property Verification &amp; Digital Deed Tracking
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
            End-to-end cryptographic cadastral governance lifecycle
          </p>
        </div>
        {record.deedNumber && onOpenDeed && (
          <button className="btn btn-primary btn-sm" onClick={onOpenDeed} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>📜</span> View Digital Deed &amp; QR
          </button>
        )}
      </div>

      <div className="timeline-stepper" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {STAGES.map((s, idx) => {
          const isDone = isApproved ? true : isRejected && idx >= 3 ? false : idx < activeIndex;
          const isCurrent = idx === activeIndex && !isApproved && !isRejected;
          const isFailed = isRejected && idx === 3;

          return (
            <div
              key={s.id}
              style={{
                background: isDone ? "var(--green-50)" : isFailed ? "#fdf2f2" : isCurrent ? "var(--paper-soft)" : "var(--paper)",
                border: `1.5px solid ${isDone ? "var(--green-700)" : isFailed ? "#e02424" : isCurrent ? "var(--gold-500)" : "var(--line)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "12px",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.72rem",
                    fontWeight: "bold",
                    background: isDone ? "var(--green-700)" : isFailed ? "#e02424" : isCurrent ? "var(--gold-500)" : "var(--line-strong)",
                    color: "#fff",
                  }}
                >
                  {isDone ? "✓" : isFailed ? "✕" : idx + 1}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>{s.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--ink-soft)", lineHeight: 1.3 }}>{s.description}</p>
            </div>
          );
        })}
      </div>

      {timelineEntries.length > 0 && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
          <h4 style={{ fontSize: "0.92rem", marginBottom: "12px", color: "var(--ink)" }}>Official Action &amp; Audit History</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {timelineEntries.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--paper-soft)",
                  borderLeft: `4px solid ${item.status === "approved" || item.status === "verified" ? "var(--green-700)" : item.status === "rejected" ? "#e02424" : "var(--gold-500)"}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--ink)" }}>{item.stage}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                    By <strong>{item.performedBy}</strong> ({item.role}) &bull; {new Date(item.date).toLocaleString()}
                  </div>
                  {item.remarks && (
                    <div style={{ fontSize: "0.82rem", color: "var(--ink)", marginTop: "4px", fontStyle: "italic" }}>
                      "{item.remarks}"
                    </div>
                  )}
                </div>
                <span
                  className={`badge ${
                    item.status === "approved" || item.status === "verified"
                      ? "badge-green"
                      : item.status === "rejected"
                      ? "badge-rose"
                      : "badge-gold"
                  }`}
                  style={{ textTransform: "capitalize" }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

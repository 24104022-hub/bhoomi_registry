import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import InteractiveMap from "../components/InteractiveMap.jsx";
import { Loader } from "../components/Feedback.jsx";

export default function VerifyDeed() {
  const { deedNumber: deedParam } = useParams();
  const [deedNumber, setDeedNumber] = useState(deedParam || "");
  const [loading, setLoading] = useState(Boolean(deedParam));
  const [deed, setDeed] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (deedParam) {
      verifyDeed(deedParam);
    }
  }, [deedParam]);

  async function verifyDeed(numberToVerify) {
    if (!numberToVerify?.trim()) return;
    setLoading(true);
    setError("");
    setDeed(null);

    try {
      const res = await fetch(`/api/deeds/verify/${encodeURIComponent(numberToVerify.trim())}`);
      const data = await res.json();

      if (data.success && data.verified) {
        setDeed(data.data);
      } else {
        setError(data.message || "No verified deed found with this identifier.");
      }
    } catch (err) {
      setError("Unable to connect to verification server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (deedNumber.trim()) {
      verifyDeed(deedNumber.trim());
    }
  }

  function handleDownloadPdf() {
    if (deed?.deedNumber) {
      window.open(`/api/deeds/${encodeURIComponent(deed.deedNumber)}/pdf`, "_blank");
    }
  }

  return (
    <div className="page-container narrow" style={{ paddingTop: "32px", paddingBottom: "48px" }}>
      {/* Verification Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "2.4rem", marginBottom: "6px" }}>🏛️</div>
        <h1 style={{ fontSize: "1.8rem", color: "var(--ink)", marginBottom: "6px" }}>
          Public Digital Deed Verification Portal
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", maxWidth: "480px", margin: "0 auto" }}>
          Official Government Cadastral &amp; Title Verification System. Verify deed authenticity, surveyor endorsements, and cryptographic integrity.
        </p>
      </div>

      {/* Verification Form */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
        <input
          type="text"
          placeholder="Enter Deed Number (e.g. DEED-2025-78219)"
          value={deedNumber}
          onChange={(e) => setDeedNumber(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", fontSize: "0.95rem", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !deedNumber.trim()}>
          {loading ? "Verifying…" : "Verify Deed"}
        </button>
      </form>

      {loading && <Loader />}

      {error && (
        <div className="state-block error-state" style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>⚠️</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Verification Failed</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>{error}</p>
        </div>
      )}

      {/* Verified Deed View */}
      {deed && (
        <div
          className="card"
          style={{
            border: deed.status === "revoked" ? "2px solid #dc2626" : deed.status === "transferred" ? "2px solid #d97706" : "2px solid var(--green-700)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {/* Top Status Ribbon */}
          <div
            style={{
              background: deed.status === "revoked" ? "#991b1b" : deed.status === "transferred" ? "#854d0e" : "var(--green-900)",
              color: "#fff",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: deed.status === "revoked" ? "#fca5a5" : deed.status === "transferred" ? "#fde047" : "var(--gold-500)",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {deed.status === "revoked"
                  ? "⚠️ TITLE DEED REVOKED / VOID"
                  : deed.status === "transferred"
                  ? "🔄 TITLE DEED TRANSFERRED"
                  : "✓ OFFICIAL RECORD VERIFIED & ACTIVE"}
              </div>
              <h2 style={{ margin: "2px 0 0", fontSize: "1.25rem", color: "#fff" }}>
                {deed.deedNumber}
              </h2>
            </div>
            <button
              className="btn btn-sm"
              onClick={handleDownloadPdf}
              style={{
                background: deed.status === "revoked" ? "#fee2e2" : "var(--gold-500)",
                color: deed.status === "revoked" ? "#991b1b" : "var(--green-900)",
                fontWeight: 600,
              }}
            >
              📥 Download Official PDF Deed
            </button>
          </div>

          {/* Status Alert Banner */}
          {deed.statusMessage && (
            <div
              style={{
                padding: "10px 20px",
                fontSize: "0.86rem",
                fontWeight: 500,
                background: deed.status === "revoked" ? "#fef2f2" : deed.status === "transferred" ? "#fffbeb" : "#f0fdf4",
                color: deed.status === "revoked" ? "#991b1b" : deed.status === "transferred" ? "#92400e" : "#166534",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {deed.statusMessage}
            </div>
          )}

          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "20px", alignItems: "start", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
                <div><strong>Registered Proprietor:</strong> {deed.ownerName} <span style={{ color: "var(--ink-soft)", fontSize: "0.82rem" }}>({deed.ownerId})</span></div>
                <div><strong>Property Title:</strong> {deed.propertyTitle}</div>
                <div><strong>Classification:</strong> {deed.propertyType}</div>
                <div><strong>Extent / Area:</strong> {Number(deed.areaSqft || 0).toLocaleString()} Sq.Ft</div>
                <div><strong>Cadastral Survey Number:</strong> <span style={{ fontWeight: 600, color: "var(--green-700)" }}>{deed.surveyNumber || "Cadastral Survey Parcel"}</span></div>
                <div><strong>Property ID:</strong> {deed.propertyId || "—"}</div>
                <div><strong>Registration ID:</strong> {deed.registrationId || "—"}</div>
                <div><strong>Registration Date:</strong> {deed.registrationDate || new Date(deed.issueDate).toLocaleDateString("en-IN")}</div>
                <div><strong>Deed Grant Date:</strong> {new Date(deed.issueDate).toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
                <div style={{ color: "var(--ink-soft)" }}><strong>Location Address:</strong> {deed.address}</div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ padding: "8px", background: "#fff", border: "1.5px solid var(--gold-500)", borderRadius: "6px", display: "inline-block" }}>
                  {deed.qrCodeDataUrl ? (
                    <img src={deed.qrCodeDataUrl} alt="Official Deed QR" style={{ width: 110, height: 110, display: "block" }} />
                  ) : (
                    <QRCodeSVG value={deed.verificationUrl || window.location.href} size={110} level="H" fgColor="#143325" />
                  )}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "4px", fontWeight: 600 }}>
                  Official Deed QR
                </div>
              </div>
            </div>

            {/* Cadastral Boundaries Grid */}
            <div style={{ marginBottom: "20px", background: "var(--paper-soft)", padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "8px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📐 Official Cadastral Boundaries</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
                <div style={{ background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: 600 }}>⬆️ North Boundary</div>
                  <div style={{ fontWeight: 500, color: "var(--ink)" }}>{deed.boundaries?.north || "Adjoining Land"}</div>
                </div>
                <div style={{ background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: 600 }}>⬇️ South Boundary</div>
                  <div style={{ fontWeight: 500, color: "var(--ink)" }}>{deed.boundaries?.south || "Adjoining Land"}</div>
                </div>
                <div style={{ background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: 600 }}>➡️ East Boundary</div>
                  <div style={{ fontWeight: 500, color: "var(--ink)" }}>{deed.boundaries?.east || "Access Roadway"}</div>
                </div>
                <div style={{ background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: 600 }}>⬅️ West Boundary</div>
                  <div style={{ fontWeight: 500, color: "var(--ink)" }}>{deed.boundaries?.west || "Property Line"}</div>
                </div>
              </div>
            </div>

            {/* Cadastral Coordinates Map */}
            {deed.coordinates && (
              <div style={{ marginTop: "16px", marginBottom: "20px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "8px" }}>
                  📍 Cadastral Location Map ({deed.coordinates.lat?.toFixed(5)}° N, {deed.coordinates.lng?.toFixed(5)}° E)
                </p>
                <InteractiveMap coordinates={deed.coordinates} readonly height="200px" />
              </div>
            )}

            {/* Endorsements */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--paper-soft)", padding: "14px", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--green-700)", fontSize: "0.85rem" }}>✓ Surveyor Certification</div>
                <div style={{ fontSize: "0.82rem", color: "var(--ink)" }}>{deed.surveyorName || "Licensed Surveyor"}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>Boundaries verified &amp; recorded</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--green-700)", fontSize: "0.85rem" }}>✓ Sub-Registrar Seal</div>
                <div style={{ fontSize: "0.82rem", color: "var(--ink)" }}>{deed.registrarName || "Sub-Registrar"}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>{deed.registrarOffice || "Sub-Registrar Office"}</div>
              </div>
            </div>

            {deed.approvalRemarks && (
              <div style={{ background: "var(--paper-soft)", padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: "16px", fontSize: "0.84rem" }}>
                <strong>Registrar Approval Remarks:</strong> {deed.approvalRemarks}
              </div>
            )}

            {/* SHA-256 Hash */}
            <div style={{ background: "var(--paper-soft)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--gold-600)" }}>
                CRYPTOGRAPHIC SHA-256 INTEGRITY FINGERPRINT:
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--ink)", wordBreak: "break-all", marginTop: "4px" }}>
                {deed.digitalSignatureHash}
              </div>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Link to="/track" className="btn btn-ghost btn-sm">
                ← Track Another Application
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

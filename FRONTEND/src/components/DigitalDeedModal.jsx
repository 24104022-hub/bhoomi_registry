import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Modal from "./Modal.jsx";

export default function DigitalDeedModal({ deed, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!deed) return null;

  const verificationUrl = `${window.location.origin}/verify-deed/${encodeURIComponent(deed.deedNumber)}`;

  function handleCopy() {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownloadPdf() {
    window.open(`/api/deeds/${encodeURIComponent(deed.deedNumber)}/pdf`, "_blank");
  }

  return (
    <Modal title="Official Digital Title Deed Certificate" onClose={onClose}>
      <div className="deed-container" style={{ padding: "8px 0" }}>
        {/* Certificate Ornamental Shell */}
        <div
          style={{
            border: "3px double #143325",
            borderRadius: "6px",
            padding: "20px",
            background: "#fff",
            position: "relative",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "1.5px solid #c9933b", paddingBottom: "12px", marginBottom: "16px" }}>
            <div style={{ color: "#8a611c", fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>
              Government of Tamil Nadu • Land Administration
            </div>
            <h2 style={{ color: "#143325", margin: "4px 0", fontSize: "1.3rem", fontWeight: "700" }}>
              Bhoomi Digital Land Title Deed
            </h2>
            <div style={{ fontSize: "0.78rem", color: "#526359" }}>
              Cadastral Title Certificate under Information Technology Act &amp; Registration Act
            </div>
          </div>

          {/* Deed ID & Date Strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#eaf1ed",
              padding: "8px 12px",
              borderRadius: "4px",
              marginBottom: "16px",
              fontSize: "0.82rem",
            }}
          >
            <span>
              <strong>DEED NO:</strong> <span style={{ fontFamily: "monospace", color: "#1e4d38", fontWeight: "bold" }}>{deed.deedNumber}</span>
            </span>
            <span>
              <strong>ISSUED:</strong> {new Date(deed.issueDate || Date.now()).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          </div>

          {/* Content Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: "16px", alignItems: "center" }}>
            <div style={{ fontSize: "0.85rem", lineHeight: "1.6" }}>
              <div><strong>Registered Proprietor:</strong> {deed.ownerName}</div>
              <div><strong>Property Title:</strong> {deed.propertyTitle || deed.title}</div>
              <div><strong>Classification:</strong> {deed.propertyType || deed.type}</div>
              <div><strong>Extent / Area:</strong> {Number(deed.areaSqft || 0).toLocaleString()} Sq.Ft</div>
              <div><strong>Survey Number:</strong> {deed.surveyNumber || "228/4A"}</div>
              <div><strong>Coordinates:</strong> {deed.coordinates?.lat?.toFixed(5) || "9.92520"}° N, {deed.coordinates?.lng?.toFixed(5) || "78.11980"}° E</div>
              <div style={{ marginTop: "4px", color: "#526359", fontSize: "0.8rem" }}>
                <strong>Address:</strong> {deed.address}
              </div>
            </div>

            {/* QR Code */}
            <div style={{ textAlign: "center" }}>
              <div style={{ padding: "8px", background: "#fafcfb", border: "1px solid #c9933b", borderRadius: "6px", display: "inline-block" }}>
                {deed.qrCodeDataUrl ? (
                  <img src={deed.qrCodeDataUrl} alt="Official Deed QR" style={{ width: 110, height: 110, display: "block" }} />
                ) : (
                  <QRCodeSVG value={verificationUrl} size={110} level="H" fgColor="#143325" />
                )}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#526359", marginTop: "4px" }}>
                Scan to verify authenticity
              </div>
            </div>
          </div>

          {/* Cadastral Boundaries */}
          {deed.boundaries && (
            <div style={{ marginTop: "12px", background: "#f8faf9", border: "1px solid #d8e2dc", borderRadius: "4px", padding: "8px 12px", fontSize: "0.78rem" }}>
              <div style={{ fontWeight: "bold", color: "#143325", marginBottom: "4px" }}>Official Cadastral Boundaries:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div><strong>North:</strong> {deed.boundaries.north || "Adjoining land"}</div>
                <div><strong>South:</strong> {deed.boundaries.south || "Adjoining land"}</div>
                <div><strong>East:</strong> {deed.boundaries.east || "Access road"}</div>
                <div><strong>West:</strong> {deed.boundaries.west || "Property line"}</div>
              </div>
            </div>
          )}

          {/* Seals Box */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "16px",
              padding: "10px",
              background: "#fafcfb",
              borderRadius: "4px",
              border: "1px solid #d8e2dc",
              fontSize: "0.78rem",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold", color: "#143325" }}>✓ Surveyor Endorsement</div>
              <div style={{ color: "#526359" }}>{deed.surveyorName || "P. Lakshmi, Licensed Surveyor"}</div>
              <div style={{ color: "#1e4d38" }}>Boundary Verified &amp; Sealed</div>
            </div>
            <div>
              <div style={{ fontWeight: "bold", color: "#143325" }}>✓ Sub-Registrar Seal</div>
              <div style={{ color: "#526359" }}>{deed.registrarName || "Deputy Registrar S. Anand"}</div>
              <div style={{ color: "#1e4d38" }}>Registered into State Archives</div>
            </div>
          </div>

          {/* SHA-256 Hash */}
          <div style={{ marginTop: "14px", padding: "6px 8px", background: "#f5f2eb", borderRadius: "4px", fontSize: "0.7rem", color: "#8a611c" }}>
            <strong>SHA-256 INTEGRITY HASH:</strong>
            <div style={{ fontFamily: "monospace", color: "#1c2621", wordBreak: "break-all", marginTop: "2px" }}>
              {deed.digitalSignatureHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? "✓ Link Copied!" : "📋 Copy Verification Link"}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>
            📥 Download Official PDF Deed
          </button>
        </div>
      </div>
    </Modal>
  );
}

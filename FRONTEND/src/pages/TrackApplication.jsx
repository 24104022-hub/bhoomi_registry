import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { StatusBadge } from "../components/Feedback.jsx";
import VerificationTimeline from "../components/VerificationTimeline.jsx";
import InteractiveMap from "../components/InteractiveMap.jsx";
import DigitalDeedModal from "../components/DigitalDeedModal.jsx";

export default function TrackApplication() {
  const { t } = useApp();
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const [ref, setRef] = useState(initialRef);
  const [loading, setLoading] = useState(Boolean(initialRef));
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeDeed, setActiveDeed] = useState(null);

  useEffect(() => {
    if (initialRef) {
      doTrack(initialRef);
    }
  }, [initialRef]);

  async function doTrack(queryRef) {
    if (!queryRef.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await api.trackApplication(queryRef);
      setResult(res);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    doTrack(ref);
  }

  async function handleOpenDeed() {
    const deedNo = result?.record?.deedNumber;
    if (!deedNo) return;
    try {
      const deed = await api.deeds.getByNumber(deedNo);
      setActiveDeed(deed);
    } catch {
      setActiveDeed({
        deedNumber: deedNo,
        propertyTitle: result.record.propertyTitle,
        propertyType: result.record.type,
        areaSqft: result.record.areaSqft,
        address: result.record.address,
        ownerName: result.record.applicantName || result.record.ownerName,
        coordinates: result.record.coordinates,
        issueDate: new Date(),
      });
    }
  }

  const record = result?.record;

  return (
    <div className="page-container" style={{ maxWidth: 860 }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1>{t("track_title")}</h1>
        <p className="page-desc">{t("track_desc")}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 600, margin: "0 auto" }}>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Enter Application Ref (e.g. REG-2026-0001) or Deed No"
          style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !ref.trim()}>
          {loading ? "Searching…" : t("track_submit")}
        </button>
      </form>

      {notFound && (
        <div className="state-block error-state" style={{ marginTop: 24, maxWidth: 600, margin: "24px auto" }}>
          <p style={{ margin: 0 }}>{t("track_notFound")}</p>
        </div>
      )}

      {record && (
        <div style={{ marginTop: 28 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p className="record-card-id">{record.id}</p>
                <h2 style={{ fontSize: "1.25rem", margin: "2px 0 6px 0", color: "var(--ink)" }}>{record.propertyTitle}</h2>
                <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  {record.address}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <StatusBadge status={record.status} />
                {record.deedNumber && (
                  <span style={{ fontSize: "0.8rem", color: "var(--green-700)", fontWeight: 600 }}>
                    📜 {record.deedNumber}
                  </span>
                )}
              </div>
            </div>

            <div className="record-card-meta" style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              {result.kind === "registration" ? (
                <>
                  <span><strong>{t("common_type")}:</strong> {record.type}</span>
                  <span><strong>{t("common_owner")}:</strong> {record.applicantName}</span>
                  <span><strong>Extent:</strong> {record.areaSqft} sq.ft</span>
                  <span><strong>Estimated Value:</strong> ₹{Number(record.estValue || 0).toLocaleString("en-IN")}</span>
                  <span><strong>{t("common_date")}:</strong> {record.submittedOn}</span>
                  {record.coordinates && (
                    <span><strong>GPS:</strong> {record.coordinates.lat?.toFixed(4)}° N, {record.coordinates.lng?.toFixed(4)}° E</span>
                  )}
                </>
              ) : (
                <>
                  <span><strong>{t("transfer_transferType")}:</strong> {record.transferType}</span>
                  <span><strong>From:</strong> {record.fromOwner}</span>
                  <span><strong>To:</strong> {record.toOwner}</span>
                  <span><strong>{t("common_date")}:</strong> {record.initiatedOn}</span>
                </>
              )}
            </div>

            {record.coordinates && (
              <div style={{ marginTop: 16 }}>
                <InteractiveMap coordinates={record.coordinates} readonly height="200px" />
              </div>
            )}
          </div>

          {/* Interactive 6-Stage Verification Timeline (Requirement 7) */}
          <VerificationTimeline record={record} onOpenDeed={handleOpenDeed} />
        </div>
      )}

      {/* Digital Deed Modal */}
      {activeDeed && (
        <DigitalDeedModal deed={activeDeed} onClose={() => setActiveDeed(null)} />
      )}
    </div>
  );
}

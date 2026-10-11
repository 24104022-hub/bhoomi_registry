import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import FormField from "../components/FormField.jsx";
import InteractiveMap from "../components/InteractiveMap.jsx";

const STEPS = ["regn_step_details", "regn_step_documents", "regn_step_payment", "regn_step_review"];

export default function PropertyRegistration() {
  const { t, user, addToast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    propertyTitle: "",
    type: "Residential",
    areaSqft: "",
    address: "",
    estValue: "",
    registrationDate: today,
    surveyNumber: "",
    boundaries: {
      north: "",
      south: "",
      east: "",
      west: "",
    },
    coordinates: { lat: 9.9252, lng: 78.1198 },
  });

  const [docName, setDocName] = useState("");
  const [paid, setPaid] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateBoundary(dir, value) {
    setForm((f) => ({
      ...f,
      boundaries: {
        ...f.boundaries,
        [dir]: value,
      },
    }));
  }

  function handleMapChange({ lat, lng, address }) {
    setForm((f) => ({
      ...f,
      coordinates: { lat, lng },
      address: address ? address : f.address,
    }));
  }

  async function handleSubmit() {
    if (!form.propertyTitle || !form.areaSqft || !form.address) {
      addToast("Please fill in property title, area, and address before submitting.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const reg = await api.registrations.create({
        propertyTitle: form.propertyTitle,
        type: form.type,
        areaSqft: Number(form.areaSqft) || 0,
        address: form.address,
        coordinates: form.coordinates,
        estValue: Number(form.estValue) || 0,
        registrationDate: form.registrationDate,
        surveyNumber: form.surveyNumber ? form.surveyNumber.trim() : undefined,
        boundaries: {
          north: form.boundaries.north || `North boundary of ${form.address.split(",")[0] || "Parcel"}`,
          south: form.boundaries.south || "Adjacent Survey Plot",
          east: form.boundaries.east || "Access Roadway",
          west: form.boundaries.west || "Property Line",
        },
        applicantId: user?.id,
        applicantName: user?.fullName,
        applicantEmail: user?.email,
        docName,
        paid,
      });

      addToast("Property registration submitted! Assigned to Licensed Surveyor for boundary verification.");
      navigate("/app/properties");
    } catch (err) {
      addToast(err.message || t("common_errorDesc"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("regn_title")}</h1>
          <p className="page-desc">{t("regn_desc")}</p>
        </div>
      </div>

      <div className="stepper">
        {STEPS.map((key, i) => (
          <div key={key} className={`step ${i < step ? "done" : i === step ? "current" : ""}`}>
            {i + 1}. {t(key)}
          </div>
        ))}
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        {step === 0 && (
          <>
            <FormField label={t("regn_propertyTitle")}>
              <input
                placeholder="e.g. 3BHK Independent Villa, K. Pudur"
                value={form.propertyTitle}
                onChange={(e) => update("propertyTitle", e.target.value)}
                required
              />
            </FormField>

            <div className="form-row">
              <FormField label={t("regn_propertyType")}>
                <select value={form.type} onChange={(e) => update("type", e.target.value)}>
                  <option>Residential</option>
                  <option>Agricultural</option>
                  <option>Commercial</option>
                  <option>Industrial</option>
                </select>
              </FormField>

              <FormField label={t("regn_area")}>
                <input
                  type="number"
                  placeholder="e.g. 2400"
                  value={form.areaSqft}
                  onChange={(e) => update("areaSqft", e.target.value)}
                  required
                />
              </FormField>
            </div>

            <div className="form-row">
              <FormField label="Registration Date (Calendar Selection)" hint="Select preferred deed registration date">
                <input
                  type="date"
                  min={today}
                  value={form.registrationDate}
                  onChange={(e) => update("registrationDate", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
                />
              </FormField>

              <FormField label={t("regn_estValue")}>
                <input
                  type="number"
                  placeholder="e.g. 4500000"
                  value={form.estValue}
                  onChange={(e) => update("estValue", e.target.value)}
                />
              </FormField>
            </div>

            {/* Google / Cadastral Maps Section */}
            <div style={{ marginTop: "12px", marginBottom: "14px" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px" }}>
                🗺️ Select Cadastral Location on Map
              </label>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "0 0 10px 0" }}>
                Click directly on the map or search your survey village to pin coordinates automatically.
              </p>
              <InteractiveMap
                coordinates={form.coordinates}
                onChange={handleMapChange}
                height="280px"
              />
            </div>

            <FormField label={t("regn_address")}>
              <textarea
                rows={2}
                placeholder="Door No, Street, Village, Taluk, District"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
              />
            </FormField>

            <FormField label="Cadastral Survey / Subdivision Number" hint="Official land revenue survey parcel identifier">
              <input
                placeholder="e.g. Survey No. 228/4A or Town Survey 102/B"
                value={form.surveyNumber}
                onChange={(e) => update("surveyNumber", e.target.value)}
              />
            </FormField>

            <div style={{ marginTop: "14px", marginBottom: "14px", background: "var(--paper-soft)", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "4px", color: "var(--ink)" }}>
                📐 Four Cadastral Boundaries (Surrounding Landmarks)
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "0 0 10px 0" }}>
                Legally mandatory boundaries to be inscribed on the permanent Title Deed.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "3px" }}>North Boundary</label>
                  <input
                    placeholder="e.g. Survey Plot 228/3 or 30ft Road"
                    value={form.boundaries.north}
                    onChange={(e) => updateBoundary("north", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: "0.85rem", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "3px" }}>South Boundary</label>
                  <input
                    placeholder="e.g. Plot No. 15 / Adjacent Land"
                    value={form.boundaries.south}
                    onChange={(e) => updateBoundary("south", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: "0.85rem", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "3px" }}>East Boundary</label>
                  <input
                    placeholder="e.g. 40 Feet Revenue Access Road"
                    value={form.boundaries.east}
                    onChange={(e) => updateBoundary("east", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: "0.85rem", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "3px" }}>West Boundary</label>
                  <input
                    placeholder="e.g. Adjoining Government Canal / Wall"
                    value={form.boundaries.west}
                    onChange={(e) => updateBoundary("west", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: "0.85rem", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <div>
            <FormField label={t("docs_upload")} hint="Sale deed draft, Patta/Chitta copy, or Survey sketch.">
              <input placeholder="registered-sale-deed.pdf" value={docName} onChange={(e) => setDocName(e.target.value)} />
            </FormField>

            <div style={{ background: "var(--paper-soft)", padding: "14px", borderRadius: "var(--radius-sm)", marginTop: "16px", fontSize: "0.85rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "6px", color: "var(--ink)" }}>📋 Required Verification Documents:</div>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--ink-soft)", lineHeight: 1.6 }}>
                <li>Encumbrance Certificate (EC) from Sub-Registrar Office</li>
                <li>Revenue Patta or Field Measurement Book (FMB) Sketch</li>
                <li>Valid Government ID Proof (Aadhaar / Voter ID / PAN)</li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ background: "var(--paper-soft)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--line)" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem" }}>Fee Breakdown</h3>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                Estimated Property Value: <strong>₹{Number(form.estValue || 0).toLocaleString("en-IN")}</strong>
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                Registration Fee (1.5%): <strong>₹{Math.round((Number(form.estValue) || 0) * 0.015).toLocaleString("en-IN")}</strong>
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Includes official cadastral survey pegging fee and Digital Deed certification charges.
              </p>

              <div style={{ marginTop: "18px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.92rem", fontWeight: 600 }}>
                  <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                  <span>Confirm Online Payment (UPI / Net Banking Simulation)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ fontSize: "0.9rem", lineHeight: "1.7" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "1.1rem", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
              Application Review &amp; Verification Preview
            </h3>
            <p><strong>{t("regn_propertyTitle")}:</strong> {form.propertyTitle || "—"}</p>
            <p><strong>{t("regn_propertyType")}:</strong> {form.type}</p>
            <p><strong>{t("regn_area")}:</strong> {form.areaSqft} sq.ft</p>
            <p><strong>Registration Date:</strong> {form.registrationDate}</p>
            <p><strong>GPS Coordinates:</strong> {form.coordinates.lat.toFixed(5)}° N, {form.coordinates.lng.toFixed(5)}° E</p>
            <p><strong>Cadastral Survey No:</strong> {form.surveyNumber || "Cadastral Survey Parcel"}</p>
            <p><strong>Four Cadastral Boundaries:</strong></p>
            <div style={{ margin: "4px 0 10px 14px", fontSize: "0.84rem", color: "var(--ink-soft)" }}>
              <div>• <strong>North:</strong> {form.boundaries.north || "Adjoining land"}</div>
              <div>• <strong>South:</strong> {form.boundaries.south || "Adjoining land"}</div>
              <div>• <strong>East:</strong> {form.boundaries.east || "Access road"}</div>
              <div>• <strong>West:</strong> {form.boundaries.west || "Property line"}</div>
            </div>
            <p><strong>Location Address:</strong> {form.address || "—"}</p>
            <p><strong>Estimated Market Value:</strong> ₹{Number(form.estValue || 0).toLocaleString("en-IN")}</p>
            <p><strong>Attached Deed Document:</strong> {docName || "Standard deed draft"}</p>
            <p><strong>Payment Status:</strong> {paid ? "Paid via UPI" : "Due upon registrar summons"}</p>

            <div style={{ marginTop: "14px" }}>
              <InteractiveMap coordinates={form.coordinates} readonly height="160px" />
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
          <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            {t("common_back")}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
              {t("common_next")}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Submitting Application…" : t("regn_submitApp")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

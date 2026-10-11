import React from "react";
import { useApp } from "../context/AppContext.jsx";
import ThemeSelector from "../components/ThemeSelector.jsx";

export default function Settings() {
  const { t, language, setLanguage, fontSize, setFontSize, addToast } = useApp();

  function apply(fn, value) {
    fn(value);
    addToast(t("settings_saved"));
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Customization & Accessibility</span>
          <h1>{t("settings_title")}</h1>
          <p className="page-desc">{t("settings_desc")}</p>
        </div>
      </div>

      {/* Complete Theme System Section */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <h3 style={{ margin: 0 }}>Theme & Visual Styling</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "var(--ink-soft)" }}>
              Choose from 6 state-grade color palettes, each engineered for Light and Dark modes.
            </p>
          </div>
        </div>
        <ThemeSelector variant="settings" />
      </div>

      {/* Language & Typography Accessibility */}
      <div className="grid cols-2">
        <div className="card">
          <p className="card-title">{t("settings_language")}</p>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 14px" }}>
            Select portal display language.
          </p>
          <div className="role-tabs" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <button
              type="button"
              className={`role-tab ${language === "en" ? "active" : ""}`}
              onClick={() => apply(setLanguage, "en")}
            >
              English (India)
            </button>
            <button
              type="button"
              className={`role-tab ${language === "ta" ? "active" : ""}`}
              onClick={() => apply(setLanguage, "ta")}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>

        <div className="card">
          <p className="card-title">{t("settings_fontSize")}</p>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 14px" }}>
            Adjust typography sizing for comfortable readability.
          </p>
          <div className="role-tabs" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <button
              type="button"
              className={`role-tab ${fontSize === "small" ? "active" : ""}`}
              onClick={() => apply(setFontSize, "small")}
            >
              {t("settings_fontSize_small")} (92%)
            </button>
            <button
              type="button"
              className={`role-tab ${fontSize === "medium" ? "active" : ""}`}
              onClick={() => apply(setFontSize, "medium")}
            >
              {t("settings_fontSize_medium")} (100%)
            </button>
            <button
              type="button"
              className={`role-tab ${fontSize === "large" ? "active" : ""}`}
              onClick={() => apply(setFontSize, "large")}
            >
              {t("settings_fontSize_large")} (112%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

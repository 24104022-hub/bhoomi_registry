import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext.jsx";
import { THEMES } from "../utils/themeConfig.js";
import Icon from "./Icon.jsx";

export default function ThemeSelector({ variant = "navbar" }) {
  const { theme, setTheme, mode, toggleMode, setMode, addToast } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  function handleSelectTheme(themeId) {
    setTheme(themeId);
    setDropdownOpen(false);
    const selected = THEMES.find((t) => t.id === themeId);
    addToast(`Theme set to ${selected?.name || themeId}`);
  }

  function handleModeToggle() {
    toggleMode();
    addToast(`Switched to ${mode === "dark" ? "Light" : "Dark"} mode`);
  }

  // Navbar variant (compact popover + light/dark toggle)
  if (variant === "navbar") {
    return (
      <div className="theme-selector-navbar" ref={dropdownRef} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        {/* Quick Palette Button */}
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="btn btn-secondary btn-sm theme-picker-btn"
          aria-label="Select Theme Palette"
          title={`Active Theme: ${currentTheme.name} (${mode})`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "5px 10px",
            height: "32px",
            borderRadius: "var(--radius-sm, 8px)",
            fontSize: "0.82rem",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: mode === "dark" ? currentTheme.primaryDark : currentTheme.primary,
              display: "inline-block",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.2), inset 0 0 2px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}
          />
          <span className="theme-name-label" style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentTheme.name}
          </span>
          <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>▼</span>
        </button>

        {/* Instant Light/Dark Mode Switcher */}
        <button
          type="button"
          onClick={handleModeToggle}
          className="btn btn-ghost btn-sm"
          title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle Light/Dark Mode"
          style={{
            height: "32px",
            width: "32px",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-sm, 8px)",
            border: "1px solid var(--line)",
          }}
        >
          {mode === "dark" ? (
            <span role="img" aria-label="Dark Mode" style={{ fontSize: "1rem" }}>🌙</span>
          ) : (
            <span role="img" aria-label="Light Mode" style={{ fontSize: "1.05rem" }}>☀️</span>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            className="theme-dropdown-menu"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 1000,
              width: "280px",
              background: "var(--paper-raised)",
              color: "var(--ink)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-md, 12px)",
              boxShadow: "var(--shadow-lg)",
              padding: "12px",
              animation: "fadeIn 0.15s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)" }}>
                Color Palettes
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => setMode("light")}
                  className={`btn btn-xs ${mode === "light" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px" }}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  onClick={() => setMode("dark")}
                  className={`btn btn-xs ${mode === "dark" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px" }}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {THEMES.map((th) => {
                const isActive = th.id === theme;
                const dotColor = mode === "dark" ? th.primaryDark : th.primary;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleSelectTheme(th.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm, 8px)",
                      border: isActive ? `1.5px solid ${dotColor}` : "1.5px solid transparent",
                      background: isActive ? "var(--primary-light)" : "transparent",
                      color: "var(--ink)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          boxShadow: `0 0 0 2px ${th.accent}44`,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: isActive ? 700 : 500, lineHeight: 1.2 }}>
                          {th.name}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                          {th.badge}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <span style={{ color: dotColor, fontWeight: 700, fontSize: "0.85rem" }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Settings Variant
  return (
    <div className="theme-selector-settings">
      {/* Light / Dark Mode Cards */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: "12px" }}>
          Mode Appearance
        </p>
        <div className="grid cols-2" style={{ gap: "14px" }}>
          <div
            onClick={() => setMode("light")}
            style={{
              cursor: "pointer",
              padding: "16px 18px",
              borderRadius: "var(--radius-md, 12px)",
              border: mode === "light" ? "2px solid var(--primary)" : "1px solid var(--line)",
              background: "#ffffff",
              color: "#0F172A",
              boxShadow: mode === "light" ? "0 0 0 3px var(--primary-light)" : "var(--shadow-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all var(--transition-fast)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>☀️</span>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0F172A" }}>Light Mode</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Crisp Slate & Clean Paper surfaces</span>
              </div>
            </div>
            {mode === "light" && <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "1.1rem" }}>✓</span>}
          </div>

          <div
            onClick={() => setMode("dark")}
            style={{
              cursor: "pointer",
              padding: "16px 18px",
              borderRadius: "var(--radius-md, 12px)",
              border: mode === "dark" ? "2px solid var(--primary)" : "1px solid #334155",
              background: "#0F172A",
              color: "#F8FAFC",
              boxShadow: mode === "dark" ? "0 0 0 3px var(--primary-light)" : "var(--shadow-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all var(--transition-fast)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>🌙</span>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#F8FAFC" }}>Dark Mode</strong>
                <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Deep Obsidian & High-Contrast Night view</span>
              </div>
            </div>
            {mode === "dark" && <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "1.1rem" }}>✓</span>}
          </div>
        </div>
      </div>

      {/* 6 Palette Cards Grid */}
      <div>
        <p style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: "12px" }}>
          Color Palettes (6 Professional Themes)
        </p>
        <div className="grid cols-3" style={{ gap: "16px" }}>
          {THEMES.map((th) => {
            const isSelected = th.id === theme;
            const primaryColor = mode === "dark" ? th.primaryDark : th.primary;
            return (
              <div
                key={th.id}
                onClick={() => handleSelectTheme(th.id)}
                className="card theme-palette-card"
                style={{
                  cursor: "pointer",
                  padding: "18px",
                  borderRadius: "var(--radius-md, 12px)",
                  border: isSelected ? `2px solid ${primaryColor}` : "1px solid var(--line)",
                  boxShadow: isSelected ? `0 0 0 3px var(--primary-light)` : "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                  transition: "all var(--transition-fast)",
                }}
              >
                {/* Palette Color Strip */}
                <div style={{ display: "flex", height: "8px", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ flex: 3, background: th.primary }} />
                  <div style={{ flex: 2, background: th.accent }} />
                  <div style={{ flex: 1, background: th.primaryDark }} />
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "1.02rem", color: "var(--ink)" }}>{th.name}</h4>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-soft)", lineHeight: 1.35 }}>
                      {th.description}
                    </p>
                  </div>
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: primaryColor,
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                </div>

                {/* Mini Sample Preview Component */}
                <div
                  style={{
                    background: "var(--paper-soft)",
                    borderRadius: "var(--radius-sm, 8px)",
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: primaryColor }}>
                    ● {th.badge}
                  </span>
                  <span
                    style={{
                      background: isSelected ? primaryColor : "var(--paper-subtle)",
                      color: isSelected ? "#ffffff" : "var(--ink)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontWeight: 600,
                    }}
                  >
                    {isSelected ? "Active" : "Select"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

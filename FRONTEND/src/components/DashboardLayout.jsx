import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import BrandMark from "./BrandMark.jsx";
import Icon from "./Icon.jsx";
import Toaster from "./Toaster.jsx";
import ChatbotWidget from "./ChatbotWidget.jsx";
import ThemeSelector from "./ThemeSelector.jsx";
import { navItemsForRole, roleLabelKey } from "../utils/roleConfig.js";

export default function DashboardLayout() {
  const { t, user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;
  const navItems = navItemsForRole(user.role);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="app-shell">
      <Toaster />
      <div className="dash-shell">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 550 }}
          />
        )}
        <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
          <Link to="/" className="brand" style={{ padding: "6px 8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "8px" }}>
            <BrandMark size={32} />
            <div className="brand-text">
              <p className="brand-title" style={{ fontSize: "1.05rem" }}>{t("appName")}</p>
              <p className="brand-sub" style={{ fontSize: "0.68rem" }}>State Land Portal</p>
            </div>
          </Link>

          <div className="dash-sidebar-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--green-500), var(--green-700))",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.88rem", flexShrink: 0
              }}>
                {userInitial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="dash-role-tag">{t(roleLabelKey(user.role))}</p>
                <p className="dash-user-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.fullName}
                </p>
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `dash-nav-link ${isActive ? "active" : ""}`}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label || (item.labelKey ? t(item.labelKey) : item.to)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="dash-nav-sep" />
          <button className="dash-nav-link" onClick={handleLogout} style={{ border: "none", cursor: "pointer", textAlign: "left", color: "#fca5a5" }}>
            <Icon name="close" size={17} />
            <span>{t("nav_logout")}</span>
          </button>
        </aside>

        <div className="dash-main">
          <div className="dash-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button className="dash-mobile-toggle" onClick={() => setSidebarOpen((v) => !v)}>
                <Icon name="menu" size={16} /> Menu
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                <span className="badge badge-green" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>● Live Registry</span>
                <span style={{ color: "var(--line-strong)" }}>&bull;</span>
                <span>{user.office || user.license || user.barId || `ID: ${user.id || "Verified"}`}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ThemeSelector variant="navbar" />
              <Link to="/track" className="btn btn-secondary btn-sm" style={{ display: "flex", gap: "6px" }}>
                <Icon name="search" size={14} /> Quick Track
              </Link>
              <Link to="/app/notifications" className="btn btn-ghost btn-sm" aria-label={t("nav_notifications")} style={{ position: "relative" }}>
                <Icon name="bell" size={18} />
                <span style={{
                  position: "absolute", top: 4, right: 6,
                  width: 7, height: 7, borderRadius: "50%", background: "var(--gold-500)"
                }} />
              </Link>
            </div>
          </div>

          <div className="dash-content">
            <Outlet />
          </div>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}

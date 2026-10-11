import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import BrandMark from "./BrandMark.jsx";
import Icon from "./Icon.jsx";
import Toaster from "./Toaster.jsx";
import ChatbotWidget from "./ChatbotWidget.jsx";
import ThemeSelector from "./ThemeSelector.jsx";

export default function PublicLayout() {
  const { t, user, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <Toaster />
      <header className="masthead">
        <div className="masthead-inner">
          <Link to="/" className="brand">
            <BrandMark />
            <div className="brand-text">
              <p className="brand-title">{t("appName")}</p>
              <p className="brand-sub">{t("appTagline")}</p>
            </div>
          </Link>

          <button className="hamburger" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            <Icon name={mobileOpen ? "close" : "menu"} />
          </button>

          <nav className={`masthead-nav ${mobileOpen ? "mobile-open" : ""}`}>
            <NavLink to="/" end onClick={() => setMobileOpen(false)}>{t("nav_home")}</NavLink>
            <NavLink to="/track" onClick={() => setMobileOpen(false)}>{t("nav_track")}</NavLink>
            <NavLink to="/verify-deed" onClick={() => setMobileOpen(false)}>Verify Deed</NavLink>
            <ThemeSelector variant="navbar" />
            {user ? (
              <>
                <NavLink to="/app/dashboard" onClick={() => setMobileOpen(false)}>{t("nav_dashboard")}</NavLink>
                <button className="link-btn" onClick={() => { logout(); navigate("/"); }}>{t("nav_logout")}</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)}>{t("nav_login")}</NavLink>
                <Link to="/register" className="masthead-cta" onClick={() => setMobileOpen(false)}>{t("nav_register")}</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>

      <ChatbotWidget />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>{t("footer_dept")}</span>
          <span>{t("home_footer_office")}</span>
          <span>&copy; {new Date().getFullYear()} {t("appName")}. {t("footer_rights")}</span>
        </div>
      </footer>
    </div>
  );
}

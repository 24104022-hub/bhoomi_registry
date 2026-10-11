import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function NotFound() {
  const { t } = useApp();
  return (
    <div className="page-container narrow" style={{ textAlign: "center" }}>
      <p className="page-eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="page-desc" style={{ margin: "0 auto 20px" }}>The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-primary">{t("nav_home")}</Link>
    </div>
  );
}

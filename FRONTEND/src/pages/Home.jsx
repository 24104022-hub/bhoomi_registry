import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import Icon from "../components/Icon.jsx";

const SERVICE_ITEMS = [
  { icon: "file-plus", title: "Property Registration", desc: "Submit conveyance deeds and enroll new properties into the state cadastral record.", to: "/login" },
  { icon: "swap", title: "Ownership Transfer", desc: "Execute certified legal transfers between buyers, sellers, or legal heirs.", to: "/login" },
  { icon: "compass", title: "Land Survey Certification", desc: "Request licensed field surveyors to verify boundaries using DGPS and ETS equipment.", to: "/login" },
  { icon: "search", title: "Track & Verify Deeds", desc: "Instantly check the real-time status of applications or verify cryptographic deed seals.", to: "/track" },
];

const ROLES_INFO = [
  { role: "Citizen & Owners", icon: "user", desc: "Register land holdings, pay stamp duty online, and access certified digital deeds.", badge: "Self-Service" },
  { role: "Field Surveyors", icon: "compass", desc: "Accept on-site survey tasks, inspect ground markers, and submit geo-tagged cadastral sketches.", badge: "Licensed" },
  { role: "Sub-Registrars", icon: "shield", desc: "Adjudicate pending conveyances, verify encumbrance certificates, and issue official deeds.", badge: "Judicial" },
  { role: "Legal Advocates", icon: "briefcase", desc: "Perform 30-year chain-of-title searches, verify affidavits, and advise clients on conveyancing.", badge: "Bar Certified" },
];

export default function Home() {
  const { t, user } = useApp();

  return (
    <>
      {/* Modern Hero Section */}
      <section style={{
        background: "linear-gradient(135deg, #0A0F1D 0%, #0F172A 60%, #1E293B 100%)",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}>
        {/* Glow Orb */}
        <div style={{
          position: "absolute", top: "-120px", right: "-120px", width: "450px", height: "450px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="page-container" style={{ position: "relative", padding: "80px 24px 72px" }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 14px",
              borderRadius: "9999px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "#34D399", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.03em", marginBottom: 18,
            }}>
              <Icon name="shield" size={14} /> State Land Administration &bull; Digital Registry 2.0
            </div>

            <h1 style={{ color: "#ffffff", fontSize: "clamp(2rem, 4.5vw, 2.9rem)", lineHeight: 1.2, fontWeight: 800 }}>
              Your Land Records, Verified &amp; Registered with Cryptographic Integrity.
            </h1>

            <p style={{ color: "rgba(255, 255, 255, 0.82)", fontSize: "1.08rem", lineHeight: 1.6, maxWidth: "56ch", margin: "16px 0 28px" }}>
              Apply for land registration, track cadastral boundary surveys, manage legal ownership conveyances, and verify digital title deeds &mdash; completely transparent and queue-free.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {!user ? (
                <>
                  <Link to="/register" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "0.95rem" }}>
                    Create Citizen Account
                  </Link>
                  <Link to="/login" className="btn btn-secondary" style={{ padding: "12px 24px", fontSize: "0.95rem", background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                    Sign In to Portal
                  </Link>
                </>
              ) : (
                <Link to="/app/dashboard" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "0.95rem" }}>
                  Go to Dashboard &rarr;
                </Link>
              )}
              <Link to="/track" className="btn btn-ghost" style={{ padding: "12px 20px", color: "rgba(255,255,255,0.85)" }}>
                <Icon name="search" size={16} /> Track Application
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="page-container" style={{ paddingBottom: 0 }}>
        <div className="grid cols-4" style={{ marginTop: "-30px", position: "relative", zIndex: 10 }}>
          <div className="stat-card" style={{ borderLeftColor: "var(--primary)" }}>
            <p className="stat-label">Registered Holdings</p>
            <p className="stat-value">18,420</p>
            <p className="stat-foot">Cadastral properties recorded</p>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "#2563EB" }}>
            <p className="stat-label">Sub-Registrar Offices</p>
            <p className="stat-value">32</p>
            <p className="stat-foot">Operational registry stations</p>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "#F59E0B" }}>
            <p className="stat-label">Average Clearance</p>
            <p className="stat-value">4.2 Days</p>
            <p className="stat-foot">From survey to deed issue</p>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "#10B981" }}>
            <p className="stat-label">Title Deeds Issued</p>
            <p className="stat-value">6,105</p>
            <p className="stat-foot">SHA-256 cryptographically sealed</p>
          </div>
        </div>

        {/* Services Grid */}
        <div style={{ marginTop: 52 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>State Public Services</span>
              <h2 className="section-title" style={{ margin: "4px 0 0" }}>Essential Land Registry Workflows</h2>
            </div>
          </div>

          <div className="grid cols-4">
            {SERVICE_ITEMS.map((item) => (
              <div className="card" key={item.title} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    width: 44, height: 44, borderRadius: "10px", background: "var(--green-100)",
                    color: "var(--green-700)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
                  }}>
                    <Icon name={item.icon} size={22} />
                  </div>
                  <h3 style={{ fontSize: "1.05rem", margin: "0 0 8px" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", margin: 0 }}>{item.desc}</p>
                </div>
                <Link to={item.to} style={{ marginTop: 18, fontSize: "0.84rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  Launch Service &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Role Modules Grid */}
        <div style={{ marginTop: 52, paddingBottom: 64 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Built for Collaboration</span>
            <h2 className="section-title" style={{ margin: "4px 0 0" }}>Specialized Portals for Key Stakeholders</h2>
          </div>

          <div className="grid cols-4">
            {ROLES_INFO.map((r) => (
              <div className="card" key={r.role}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "8px", background: "var(--paper-soft)",
                    color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Icon name={r.icon} size={18} />
                  </div>
                  <span className="badge badge-neutral">{r.badge}</span>
                </div>
                <h3 style={{ fontSize: "1rem", margin: "0 0 6px" }}>{r.role}</h3>
                <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)", margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

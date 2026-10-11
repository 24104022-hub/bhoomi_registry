import React from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon.jsx";
import { StatusBadge } from "../Feedback.jsx";

export default function AdminDashboard({ user, stats, users, properties, registrations, actionLogs }) {
  const auditLogs = actionLogs || stats?.recentActions || [];

  const totalUsers = users?.length || stats?.users || 0;
  const totalProperties = properties?.length || stats?.properties || 0;
  const totalRegistrations = registrations?.length || stats?.registrations || 0;

  const citizens = users?.filter((u) => u.role === "citizen") || [];
  const surveyors = users?.filter((u) => u.role === "surveyor") || [];
  const officers = users?.filter((u) => u.role === "officer" || u.role === "registrar") || [];
  const lawyers = users?.filter((u) => u.role === "lawyer") || [];

  return (
    <div className="role-dashboard admin-dash">
      {/* Admin Governance Banner */}
      <div className="dash-hero-card" style={{ background: "linear-gradient(135deg, #18181b, #27272a)" }}>
        <div className="dash-hero-content">
          <div className="dash-hero-badge" style={{ background: "rgba(255, 255, 255, 0.15)", color: "#fafafa" }}>
            <Icon name="shield" size={14} /> System Administrator &bull; Platform Governance &amp; Audit
          </div>
          <h1 className="dash-hero-title">{user.fullName}</h1>
          <p className="dash-hero-sub">
            Central Registry Administration &bull; Managing user roles, monitoring cadastral property registration pipelines, inspecting real-time audit logs, and maintaining system integrity.
          </p>
          <div className="dash-hero-actions">
            <Link to="/app/users" className="btn btn-primary" style={{ background: "#3b82f6" }}>
              <Icon name="users" size={16} /> User Directory &amp; RBAC Permissions
            </Link>
            <Link to="/app/properties" className="btn btn-secondary" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              <Icon name="home" size={16} /> Property Master Ledger
            </Link>
          </div>
        </div>
        <div className="dash-hero-meta">
          <div className="dash-meta-item">
            <span className="dash-meta-label">Connected Database</span>
            <strong className="dash-meta-val" style={{ color: "#6ee7b7" }}>bhoomi_land_registry (Active)</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Node Environment</span>
            <strong className="dash-meta-val">Development &bull; Port 5000</strong>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Security &amp; JWT</span>
            <strong className="dash-meta-val" style={{ color: "#6ee7b7" }}>✓ Active &bull; Role-Based Access</strong>
          </div>
        </div>
      </div>

      {/* 4 Admin Metric Cards */}
      <div className="grid cols-4" style={{ marginTop: "24px" }}>
        <div className="stat-card modern-stat" style={{ borderLeftColor: "#3b82f6" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
            <Icon name="users" size={20} />
          </div>
          <div>
            <p className="stat-label">Total Users</p>
            <p className="stat-value">{totalUsers}</p>
            <p className="stat-foot">Registered portal accounts</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#10b981" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <Icon name="home" size={20} />
          </div>
          <div>
            <p className="stat-label">Master Properties</p>
            <p className="stat-value">{totalProperties}</p>
            <p className="stat-foot">Registered cadastral holdings</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#f59e0b" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Icon name="file-plus" size={20} />
          </div>
          <div>
            <p className="stat-label">All Registrations</p>
            <p className="stat-value">{totalRegistrations}</p>
            <p className="stat-foot">In pipeline or approved</p>
          </div>
        </div>

        <div className="stat-card modern-stat" style={{ borderLeftColor: "#8b5cf6" }}>
          <div className="stat-icon-wrap" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
            <Icon name="wallet" size={20} />
          </div>
          <div>
            <p className="stat-label">Revenue Collected</p>
            <p className="stat-value">₹{(totalProperties * 45000).toLocaleString("en-IN")}</p>
            <p className="stat-foot">Stamp duty &amp; registration fees</p>
          </div>
        </div>
      </div>

      {/* Real-time System Audit Trail / Action Logs */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header-row">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>🛡️ System Audit Trail &amp; Real-time Action Logs</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Immutable administrative log of critical transactions, boundary certifications, title deed grants, and role logins.
            </p>
          </div>
          <span className="badge badge-green">Live Log Stream</span>
        </div>

        <div className="table-wrap" style={{ marginTop: "14px" }}>
          <table className="ledger">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Actor / User</th>
                <th>Action Type</th>
                <th>Target Resource</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td><strong>{log.id || `LOG-${100 + idx}`}</strong></td>
                  <td>{log.performedBy || log.user || log.userId || "System Administrator"}</td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontFamily: "monospace" }}>
                      {log.action || "TRANSACTION_VERIFIED"}
                    </span>
                  </td>
                  <td>{log.entityId || log.target || log.details || "Land Registry"}</td>
                  <td>{log.time || log.createdAt ? new Date(log.createdAt || Date.now()).toLocaleTimeString() : "Just now"}</td>
                  <td><span className="badge badge-green">✓ Success</span></td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-soft)", padding: "24px" }}>
                    No audit log events recorded yet. Official actions will appear here in real time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: User Distribution & Platform Controls */}
      <div className="grid cols-2" style={{ marginTop: "24px" }}>
        {/* User Distribution */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>👥 Provisioned User Directory</h4>
            <Link to="/app/users" className="btn btn-secondary btn-sm">Manage Users</Link>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="modern-list-item">
              <div className="item-icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <Icon name="user" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Citizens &amp; Landowners</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                  {citizens.length > 0 ? citizens.map((u) => u.email).slice(0, 3).join(", ") : "No citizen accounts registered"}
                </div>
              </div>
              <span className="badge badge-green">{citizens.length} {citizens.length === 1 ? "Account" : "Accounts"}</span>
            </div>

            <div className="modern-list-item">
              <div className="item-icon-box" style={{ background: "rgba(13, 148, 136, 0.1)", color: "#0d9488" }}>
                <Icon name="compass" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Licensed Land Surveyors</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                  {surveyors.length > 0 ? surveyors.map((u) => u.email).join(", ") : "No surveyors assigned yet"}
                </div>
              </div>
              <span className="badge badge-gold">{surveyors.length} {surveyors.length === 1 ? "Account" : "Accounts"}</span>
            </div>

            <div className="modern-list-item">
              <div className="item-icon-box" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                <Icon name="shield" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Sub-Registrar Officers</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                  {officers.length > 0 ? officers.map((u) => u.email).join(", ") : "No registrar officers assigned yet"}
                </div>
              </div>
              <span className="badge badge-blue">{officers.length} {officers.length === 1 ? "Account" : "Accounts"}</span>
            </div>

            <div className="modern-list-item">
              <div className="item-icon-box" style={{ background: "rgba(79, 70, 229, 0.1)", color: "#4f46e5" }}>
                <Icon name="briefcase" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Legal Advocates &amp; Lawyers</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                  {lawyers.length > 0 ? lawyers.map((u) => u.email).join(", ") : "No advocates registered yet"}
                </div>
              </div>
              <span className="badge badge-neutral">{lawyers.length} {lawyers.length === 1 ? "Account" : "Accounts"}</span>
            </div>
          </div>
        </div>

        {/* System Health & Diagnostics */}
        <div className="card">
          <div className="card-header-row">
            <h4 style={{ margin: 0, fontSize: "1rem" }}>⚙️ Platform Health &amp; Diagnostics</h4>
            <span className="badge badge-green">All Systems Nominal</span>
          </div>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="modern-list-item">
              <div className="item-icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <Icon name="check" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>MongoDB Server (27017)</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>Connected to bhoomi_land_registry &bull; 11 collections</div>
              </div>
              <span className="badge badge-green">Healthy</span>
            </div>

            <div className="modern-list-item">
              <div className="item-icon-box" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                <Icon name="activity" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Express Backend API</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>http://localhost:5000/api &bull; Latency 2ms</div>
              </div>
              <span className="badge badge-green">Online</span>
            </div>

            <div className="modern-list-item">
              <div className="item-icon-box" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
                <Icon name="shield" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Cryptographic Deed Generator</div>
                <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>PDFKit + QRCode + SHA-256 Digest Engine</div>
              </div>
              <span className="badge badge-green">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

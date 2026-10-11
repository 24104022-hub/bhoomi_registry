import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { ROLES, roleLabelKey, roleTabLabel } from "../utils/roleConfig.js";
import FormField from "../components/FormField.jsx";

const DEMO_CREDENTIALS = {
  surveyor: { email: "surveyor@bhoomi.gov.in", password: "Surveyor@Bhoomi2026!" },
  officer: { email: "officer@bhoomi.gov.in", password: "Officer@Bhoomi2026!" },
  lawyer: { email: "lawyer@bhoomi.gov.in", password: "Lawyer@Bhoomi2026!" },
  admin: { email: "admin@bhoomi.gov.in", password: "Admin@Bhoomi2026!" },
};

export default function Login() {
  const { role: roleParam } = useParams();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(ROLES.includes(roleParam) ? roleParam : "citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const { t, login, addToast } = useApp();
  const navigate = useNavigate();

  // Check URL error parameter (e.g. from OAuth callback redirect)
  useEffect(() => {
    const urlErr = searchParams.get("error");
    if (urlErr) {
      setError(decodeURIComponent(urlErr));
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await api.login({ email, password });
      login(user);
      addToast(`${t("dash_welcome")}, ${user.fullName.split(" ")[0]}`);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.data?.message || err.message || t("login_invalid"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLoginClick() {
    setGoogleLoading(true);
    setError("");
    try {
      const authInfo = await api.getGoogleAuthUrl({ redirect: "/app/dashboard" });
      if (authInfo.url) {
        // Direct redirect to live Google OAuth 2.0 Consent Screen
        window.location.href = authInfo.url;
      } else {
        setError("Google OAuth is not configured on the server.");
      }
    } catch (err) {
      setError(err.message || "Unable to initiate Google OAuth.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="page-container narrow login-page">
      <div className="auth-shell">
        <h1>{t("login_title")}</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: -8, marginBottom: 20 }}>
          Secure Authentication &bull; Bhoomi Land Registry &amp; Management Portal
        </p>

        {/* Role Tabs */}
        <div className="role-tabs" role="tablist" aria-label={t("login_selectRole")}>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              className={`role-tab ${role === r ? "active" : ""}`}
              onClick={() => {
                setRole(r);
                setError("");
                if (DEMO_CREDENTIALS[r]) {
                  setEmail(DEMO_CREDENTIALS[r].email);
                  setPassword(DEMO_CREDENTIALS[r].password);
                }
              }}
              title={t(roleLabelKey(r))}
            >
              {roleTabLabel(r)}
            </button>
          ))}
        </div>

        {/* Role Information Banner */}
        <div
          style={{
            background: "var(--paper-soft)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm, 8px)",
            fontSize: "0.82rem",
            color: "var(--ink-soft)",
            marginBottom: "18px",
            borderLeft: "3.5px solid var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            Signing in to <strong style={{ color: "var(--ink)" }}>{t(roleLabelKey(role))}</strong> portal
          </div>
          {DEMO_CREDENTIALS[role] ? (
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_CREDENTIALS[role].email);
                setPassword(DEMO_CREDENTIALS[role].password);
                setError("");
              }}
              style={{
                fontSize: "0.76rem",
                color: "var(--primary)",
                fontWeight: 600,
                background: "var(--primary-light)",
                border: "1px solid var(--primary-border)",
                padding: "3px 10px",
                borderRadius: "9999px",
                cursor: "pointer",
              }}
            >
              ⚡ Auto-Fill Demo Credentials
            </button>
          ) : (
            <span
              style={{
                fontSize: "0.76rem",
                color: "var(--primary)",
                fontWeight: 600,
                background: "var(--primary-light)",
                border: "1px solid var(--primary-border)",
                padding: "2px 8px",
                borderRadius: "9999px",
              }}
            >
              Auto Role Detection
            </span>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "var(--maroon-50)",
              border: "1px solid var(--maroon-100)",
              color: "var(--maroon-700)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm, 8px)",
              fontSize: "0.84rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label={t("login_email")}>
            <input
              type="email"
              required
              placeholder="Enter your verified email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </FormField>
          <FormField label={t("login_password")}>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Signing in…" : t("login_submit")}
          </button>
        </form>

        {/* Google Authentication Section */}
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              textAlign: "center",
              color: "var(--ink-soft)",
              fontSize: "0.8rem",
              margin: "16px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
            <span style={{ padding: "0 10px" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={googleLoading}
            className="btn btn-secondary btn-block"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "var(--paper-raised)",
              border: "1px solid var(--line-strong)",
              fontWeight: 600,
              padding: "11px 16px",
              fontSize: "0.92rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>
              {googleLoading ? "Connecting to Google OAuth…" : "Sign in with Google"}
            </span>
          </button>

          <div
            style={{
              marginTop: "12px",
              textAlign: "center",
              fontSize: "0.84rem",
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>New to Bhoomi?</span>
            <button
              type="button"
              onClick={handleGoogleLoginClick}
              disabled={googleLoading}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--primary)",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.84rem",
              }}
            >
              Sign up with Google
            </button>
          </div>
        </div>

        <p style={{ marginTop: 18, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
          {t("login_noAccount")} <Link to="/register">{t("login_registerLink")}</Link>
        </p>
      </div>
    </div>
  );
}

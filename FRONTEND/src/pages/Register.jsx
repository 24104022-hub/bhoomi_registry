import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import FormField from "../components/FormField.jsx";

export default function Register() {
  const [searchParams] = useSearchParams();
  const { t, login, addToast } = useApp();
  const navigate = useNavigate();

  // Check if this is a callback from Google OAuth
  const googleRegToken = searchParams.get("googleRegToken");
  const googleEmail = searchParams.get("email") || "";
  const googleName = searchParams.get("name") || "";
  const googleAvatar = searchParams.get("avatar") || searchParams.get("picture") || "";
  const isGoogleFlow = Boolean(googleRegToken);

  // Traditional registration state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    aadhaar: "",
    password: "",
    confirmPassword: "",
  });

  // Google registration state
  const [googleForm, setGoogleForm] = useState({
    fullName: googleName || "",
    role: "citizen", // Allowed options: citizen, surveyor, lawyer
    phone: "",
    aadhaar: "",
    license: "",
    barId: "",
  });

  useEffect(() => {
    if (googleName) {
      setGoogleForm((prev) => ({ ...prev, fullName: googleName }));
    }
  }, [googleName]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateGoogle(key, value) {
    setGoogleForm((f) => ({ ...f, [key]: value }));
  }

  function validateTraditional() {
    const errs = {};
    ["fullName", "email", "phone", "aadhaar", "password", "confirmPassword"].forEach((k) => {
      if (!form[k].trim()) errs[k] = t("common_required");
    });
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errs.confirmPassword = t("register_mismatch");
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateTraditional();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.register(payload);
      addToast(t("register_success"));
      navigate("/login");
    } catch (err) {
      if (err.message === "USER_EXISTS") {
        setErrors({ email: t("register_exists") });
      } else {
        addToast(t("common_errorDesc"), "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUpClick() {
    setGoogleLoading(true);
    setErrors({});
    try {
      const authInfo = await api.getGoogleAuthUrl({ redirect: "/app/dashboard" });
      if (authInfo.url) {
        window.location.href = authInfo.url;
      } else {
        setErrors({ general: "Google OAuth is not configured on the server." });
      }
    } catch (err) {
      setErrors({ general: err.message || "Unable to initiate Google OAuth." });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleGoogleRegistrationSubmit(e) {
    e.preventDefault();
    setErrors({});

    if (!googleForm.fullName.trim()) {
      setErrors({ fullName: "Full name is required." });
      return;
    }

    if (googleForm.role === "surveyor" && !googleForm.license.trim()) {
      setErrors({ license: "Surveyor License number is required for surveyor accounts." });
      return;
    }

    if (googleForm.role === "lawyer" && !googleForm.barId.trim()) {
      setErrors({ barId: "Bar Council ID is required for lawyer accounts." });
      return;
    }

    setLoading(true);
    try {
      const user = await api.completeGoogleRegistration({
        googleRegToken,
        fullName: googleForm.fullName,
        role: googleForm.role,
        phone: googleForm.phone,
        aadhaar: googleForm.aadhaar,
        license: googleForm.license,
        barId: googleForm.barId,
      });

      login(user);
      addToast(`Account created successfully! Welcome, ${user.fullName}.`);
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setErrors({ general: err.data?.message || err.message || "Failed to complete Google registration." });
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // GOOGLE REGISTRATION COMPLETION VIEW (Role Selection)
  // -------------------------------------------------------------------------
  if (isGoogleFlow) {
    return (
      <div className="page-container narrow">
        <div className="auth-shell">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--paper-soft)",
                border: "1px solid var(--line-strong)",
                padding: "6px 14px",
                borderRadius: "9999px",
                marginBottom: "14px",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--ink)" }}>
                Google Identity Verified
              </span>
            </div>
            <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>Complete Your Registration</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", margin: 0 }}>
              Select your Bhoomi Registry workspace role and profile details.
            </p>
          </div>

          {errors.general && (
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
              {errors.general}
            </div>
          )}

          {/* Verified Google Account Banner */}
          <div
            style={{
              background: "var(--paper-soft)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm, 8px)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {googleAvatar ? (
              <img
                src={googleAvatar}
                alt="Avatar"
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                {googleEmail.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)" }}>
                {googleForm.fullName || googleEmail}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{googleEmail}</span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--forest-700, #166534)",
                    background: "var(--forest-100, #dcfce7)",
                    padding: "1px 6px",
                    borderRadius: "9999px",
                    fontWeight: 600,
                  }}
                >
                  ✓ Verified
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleGoogleRegistrationSubmit}>
            <FormField label="Full Name" error={errors.fullName}>
              <input
                type="text"
                required
                value={googleForm.fullName}
                onChange={(e) => updateGoogle("fullName", e.target.value)}
                placeholder="Enter your full name"
              />
            </FormField>

            <FormField label="Verified Google Email">
              <input
                type="email"
                disabled
                readOnly
                value={googleEmail}
                style={{ background: "var(--paper-soft)", cursor: "not-allowed", opacity: 0.85 }}
              />
            </FormField>

            {/* Allowed Role Selection (Citizen, Surveyor, Lawyer only; Admin/Registrar restricted) */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: "8px",
                }}
              >
                Select Your Role <span style={{ color: "var(--maroon-600)" }}>*</span>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                {/* Option 1: Citizen */}
                <div
                  onClick={() => updateGoogle("role", "citizen")}
                  style={{
                    border: `2px solid ${googleForm.role === "citizen" ? "var(--primary)" : "var(--line)"}`,
                    background: googleForm.role === "citizen" ? "var(--primary-light, rgba(37,99,235,0.06))" : "var(--paper)",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm, 8px)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.92rem" }}>
                      Citizen / Property Owner
                    </div>
                    <input
                      type="radio"
                      name="role"
                      checked={googleForm.role === "citizen"}
                      onChange={() => updateGoogle("role", "citizen")}
                    />
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                    Apply for land registration, deeds, title transfers, and pay statutory fees.
                  </p>
                </div>

                {/* Option 2: Surveyor */}
                <div
                  onClick={() => updateGoogle("role", "surveyor")}
                  style={{
                    border: `2px solid ${googleForm.role === "surveyor" ? "var(--primary)" : "var(--line)"}`,
                    background: googleForm.role === "surveyor" ? "var(--primary-light, rgba(37,99,235,0.06))" : "var(--paper)",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm, 8px)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.92rem" }}>
                      Licensed Surveyor
                    </div>
                    <input
                      type="radio"
                      name="role"
                      checked={googleForm.role === "surveyor"}
                      onChange={() => updateGoogle("role", "surveyor")}
                    />
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                    Inspect parcel boundaries, GPS land demarcations, and verify cadastral GIS coordinates.
                  </p>
                </div>

                {/* Option 3: Lawyer */}
                <div
                  onClick={() => updateGoogle("role", "lawyer")}
                  style={{
                    border: `2px solid ${googleForm.role === "lawyer" ? "var(--primary)" : "var(--line)"}`,
                    background: googleForm.role === "lawyer" ? "var(--primary-light, rgba(37,99,235,0.06))" : "var(--paper)",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm, 8px)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.92rem" }}>
                      Advocate / Lawyer
                    </div>
                    <input
                      type="radio"
                      name="role"
                      checked={googleForm.role === "lawyer"}
                      onChange={() => updateGoogle("role", "lawyer")}
                    />
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                    Verify title deeds, conduct encumbrance diligence, and certify conveyance instruments.
                  </p>
                </div>
              </div>

              {/* Informational notice regarding Registrar and Admin restrictions */}
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "0.76rem",
                  color: "var(--ink-soft)",
                  background: "var(--paper-soft)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  borderLeft: "3px solid var(--ink-soft)",
                }}
              >
                <strong>Restricted Roles:</strong> Registrar and Administrator accounts require authorized
                government appointment and cannot be self-selected.
              </div>
            </div>

            {/* Role-Specific Fields */}
            {googleForm.role === "surveyor" && (
              <FormField label="Surveyor License Number *" error={errors.license}>
                <input
                  type="text"
                  required
                  placeholder="e.g. SURV-KA-2026-0089"
                  value={googleForm.license}
                  onChange={(e) => updateGoogle("license", e.target.value)}
                />
              </FormField>
            )}

            {googleForm.role === "lawyer" && (
              <FormField label="Bar Council Registration / Bar ID *" error={errors.barId}>
                <input
                  type="text"
                  required
                  placeholder="e.g. BAR-IND-2024-4192"
                  value={googleForm.barId}
                  onChange={(e) => updateGoogle("barId", e.target.value)}
                />
              </FormField>
            )}

            <div className="form-row">
              <FormField label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={googleForm.phone}
                  onChange={(e) => updateGoogle("phone", e.target.value)}
                />
              </FormField>
              <FormField label="Aadhaar / National ID" error={errors.aadhaar}>
                <input
                  type="text"
                  placeholder="1234-5678-9012"
                  value={googleForm.aadhaar}
                  onChange={(e) => updateGoogle("aadhaar", e.target.value)}
                />
              </FormField>
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
              {loading ? "Registering account…" : "Complete Registration & Launch Workspace"}
            </button>
          </form>

          <p style={{ marginTop: 18, fontSize: "0.85rem", textAlign: "center", color: "var(--ink-soft)" }}>
            Need to sign in with a different account? <Link to="/login">Cancel and return to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // STANDARD REGISTRATION VIEW (With Visible Sign up with Google Option)
  // -------------------------------------------------------------------------
  return (
    <div className="page-container narrow">
      <div className="auth-shell">
        <h1>{t("register_title")}</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: -8, marginBottom: 20 }}>
          Create your verified Bhoomi Land Registry account
        </p>

        {errors.general && (
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
            {errors.general}
          </div>
        )}

        {/* Visible "Sign up with Google" Option */}
        <button
          type="button"
          onClick={handleGoogleSignUpClick}
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
          <span>{googleLoading ? "Connecting to Google…" : "Sign up with Google"}</span>
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            textAlign: "center",
            color: "var(--ink-soft)",
            fontSize: "0.8rem",
            margin: "20px 0 18px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
          <span style={{ padding: "0 10px" }}>OR REGISTER WITH EMAIL</span>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <FormField label={t("register_fullName")} error={errors.fullName}>
            <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </FormField>
          <FormField label={t("register_email")} error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </FormField>
          <div className="form-row">
            <FormField label={t("register_phone")} error={errors.phone}>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </FormField>
            <FormField label={t("register_aadhaar")} error={errors.aadhaar}>
              <input value={form.aadhaar} onChange={(e) => update("aadhaar", e.target.value)} />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label={t("register_password")} error={errors.password}>
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
            </FormField>
            <FormField label={t("register_confirmPassword")} error={errors.confirmPassword}>
              <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
            </FormField>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "…" : t("register_submit")}
          </button>
        </form>
        <p style={{ marginTop: 18, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
          {t("register_haveAccount")} <Link to="/login">{t("register_loginLink")}</Link>
        </p>
      </div>
    </div>
  );
}

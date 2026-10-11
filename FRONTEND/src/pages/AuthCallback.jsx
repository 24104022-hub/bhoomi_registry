import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api, setToken } from "../services/api.js";
import BrandMark from "../components/BrandMark.jsx";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, addToast } = useApp();
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function processCallback() {
      const token = searchParams.get("token");
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const googleRegToken = searchParams.get("googleRegToken");
      const redirect = searchParams.get("redirect") || "/app/dashboard";

      if (error) {
        if (mounted) {
          setStatus("error");
          setErrorMessage(decodeURIComponent(error));
        }
        return;
      }

      // If new Google user redirected here with googleRegToken, forward to registration form
      if (googleRegToken) {
        navigate(`/register?${searchParams.toString()}`, { replace: true });
        return;
      }

      try {
        let activeToken = token;

        // If code received on frontend instead of direct token redirect
        if (!activeToken && code) {
          const res = await api.exchangeGoogleCode({
            code,
            state,
            redirect_uri: window.location.origin + window.location.pathname,
          });

          // Check if new Google user needs role selection
          if (res.isNewUser && res.googleRegToken) {
            const q = new URLSearchParams({
              googleRegToken: res.googleRegToken,
              email: res.profile?.email || "",
              name: res.profile?.fullName || "",
              googleId: res.profile?.googleId || "",
              avatar: res.profile?.avatar || "",
              redirect,
            });
            navigate(`/register?${q.toString()}`, { replace: true });
            return;
          }

          if (res.token) {
            activeToken = res.token;
          }
        }

        if (!activeToken) {
          throw new Error("No authorization token received in OAuth callback.");
        }

        // Store JWT token
        setToken(activeToken);

        // Fetch fresh user profile
        const user = await api.getMe();
        if (!mounted) return;

        login(user);
        const roleLabel = user.role ? ` [${user.role.toUpperCase()}]` : "";
        addToast(`Signed in successfully as ${user.fullName}${roleLabel}`);
        navigate(redirect, { replace: true });
      } catch (err) {
        if (mounted) {
          setStatus("error");
          setErrorMessage(err.message || "Failed to finalize Google Sign-In session.");
        }
      }
    }

    processCallback();

    return () => {
      mounted = false;
    };
  }, [searchParams, navigate, login, addToast]);

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "460px",
          width: "100%",
          textAlign: "center",
          padding: "36px 30px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <BrandMark size={48} />
        </div>

        {status === "verifying" && (
          <div>
            <div
              style={{
                width: "44px",
                height: "44px",
                margin: "0 auto 18px",
                border: "3px solid var(--line)",
                borderTopColor: "var(--primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 8px" }}>Authenticating with Google</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", margin: 0 }}>
              Verifying credentials, securing session token, and routing to your role workspace…
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "var(--maroon-100)",
                color: "var(--maroon-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              ⚠
            </div>
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 8px", color: "var(--maroon-600)" }}>
              Authentication Failed
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginBottom: "20px" }}>
              {errorMessage}
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Return to Login
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

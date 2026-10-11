import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState, EmptyState } from "../components/Feedback.jsx";

export default function Notifications() {
  const { t, user } = useApp();
  const [filterStatus, setFilterStatus] = useState("all");
  const [retryingId, setRetryingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const { data: responseData, loading, error, reload } = useAsync(
    async () => {
      const res = await api.notifications.getHistory({
        userId: user?.id,
        status: filterStatus === "all" ? undefined : filterStatus,
      });
      return res;
    },
    [user?.id, filterStatus]
  );

  const notifications = responseData?.data || [];
  const stats = {
    total: responseData?.total ?? notifications.length,
    unreadCount: responseData?.unreadCount ?? notifications.filter((n) => !n.read).length,
    sentCount: responseData?.sentCount ?? notifications.filter((n) => n.deliveryStatus === "sent").length,
    failedCount: responseData?.failedCount ?? notifications.filter((n) => n.deliveryStatus === "failed").length,
  };

  async function handleMarkRead(id) {
    try {
      await api.notifications.markAsRead(id);
      await reload();
    } catch {
      /* ignore */
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.notifications.markAllRead();
      await reload();
    } catch {
      /* ignore */
    }
  }

  async function handleRetryDelivery(id) {
    setRetryingId(id);
    setToastMessage(null);
    try {
      const res = await api.notifications.retry(id);
      if (res.success) {
        setToastMessage({
          type: "success",
          text: "Email successfully dispatched over SMTP! Status updated to delivered.",
        });
      } else {
        setToastMessage({
          type: "error",
          text: res.message || "Retry failed. Please verify SMTP server settings in backend/.env.",
        });
      }
      await reload();
    } catch (err) {
      setToastMessage({
        type: "error",
        text: err.message || "Failed to retry delivery over SMTP.",
      });
    } finally {
      setRetryingId(null);
    }
  }

  const actionLabels = {
    REGISTRATION_SUBMITTED: "Application Received",
    SURVEY_COMPLETED: "Boundary Survey Verified",
    SURVEY_FLAGGED: "Survey Action Required",
    REGISTRAR_APPROVED: "Registrar Approval & Deed",
    REGISTRAR_REJECTED: "Application Rejected",
    DEED_GENERATED: "Digital Deed Generated",
    TRANSFER_REQUESTED: "Transfer Initiated",
    TRANSFER_APPROVED: "Transfer Executed",
    TRANSFER_REJECTED: "Transfer Rejected",
    APPOINTMENT_SCHEDULED: "Hearing Scheduled",
    APPOINTMENT_UPDATED: "Appointment Updated",
  };

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <h1>{t("notif_title") || "Notifications & Delivery History"}</h1>
          <p className="page-desc">
            Official registry notices, SMTP email transmission audit records, and delivery telemetry.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {stats.unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              {t("notif_markAllRead") || "Mark All as Read"}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => reload()} title="Refresh list">
            🔄 Refresh
          </button>
        </div>
      </div>

      {toastMessage && (
        <div
          style={{
            marginBottom: 18,
            padding: "12px 16px",
            borderRadius: 6,
            backgroundColor: toastMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${toastMessage.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: toastMessage.type === "success" ? "#065f46" : "#991b1b",
            fontSize: "0.9rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
              color: "inherit",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Telemetry Stats Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="card" style={{ padding: "14px 18px" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Records
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--ink-base)" }}>
            {stats.total}
          </p>
        </div>

        <div className="card" style={{ padding: "14px 18px", borderLeft: "4px solid #10b981" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#065f46", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            SMTP Delivered
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#047857" }}>
            {stats.sentCount}
          </p>
        </div>

        <div className="card" style={{ padding: "14px 18px", borderLeft: "4px solid #ef4444" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Delivery Failed
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#dc2626" }}>
            {stats.failedCount}
          </p>
        </div>

        <div className="card" style={{ padding: "14px 18px", borderLeft: "4px solid #f59e0b" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Unread Alerts
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#b45309" }}>
            {stats.unreadCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
        <button
          className={`btn btn-sm ${filterStatus === "all" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterStatus("all")}
        >
          All ({stats.total})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === "sent" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterStatus("sent")}
        >
          Delivered ({stats.sentCount})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === "failed" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterStatus("failed")}
        >
          Failed ({stats.failedCount})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === "pending" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterStatus("pending")}
        >
          Pending
        </button>
      </div>

      {loading && <Loader />}
      {error && <ErrorState onRetry={reload} description={error.message} />}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          title="No notification records found"
          description={
            filterStatus !== "all"
              ? `No notifications currently matched the '${filterStatus}' delivery filter.`
              : t("notif_empty") || "You do not have any official notifications yet."
          }
        />
      )}

      {!loading && !error && notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notifications.map((n) => {
            const isFailed = n.deliveryStatus === "failed";
            const isSent = n.deliveryStatus === "sent" || n.emailSent;
            const borderCol = isFailed ? "#ef4444" : isSent ? "#10b981" : !n.read ? "var(--gold-500)" : "transparent";

            return (
              <div
                key={n.id || n._id}
                className="card"
                style={{
                  padding: "16px 20px",
                  borderLeft: `4px solid ${borderCol}`,
                  position: "relative",
                  background: n.read ? "var(--card-bg, #ffffff)" : "var(--bg-elevated, #fbfdfc)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 60%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "1.02rem",
                          color: "var(--ink-base)",
                        }}
                      >
                        {n.title}
                      </span>

                      {n.actionType && (
                        <span
                          className="badge badge-neutral"
                          style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                        >
                          {actionLabels[n.actionType] || n.actionType}
                        </span>
                      )}

                      {!n.read && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>

                    <p style={{ margin: "4px 0 8px", color: "var(--ink-soft)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                      {n.body}
                    </p>

                    {/* Metadata tags */}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 6 }}>
                      {n.referenceId && (
                        <span>
                          <strong>Ref ID:</strong> <span style={{ fontFamily: "monospace" }}>{n.referenceId}</span>
                        </span>
                      )}
                      {n.propertyTitle && (
                        <span>
                          <strong>Property:</strong> {n.propertyTitle}
                        </span>
                      )}
                      {n.recipientEmail && (
                        <span>
                          <strong>Recipient:</strong> {n.recipientEmail}
                        </span>
                      )}
                      <span>
                        <strong>Date:</strong> {n.date || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent")}
                      </span>
                    </div>

                    {/* Delivery telemetry section */}
                    <div
                      style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        backgroundColor: isFailed ? "#fef2f2" : isSent ? "#f0fdf4" : "#fefce8",
                        borderRadius: 6,
                        border: `1px solid ${isFailed ? "#fecaca" : isSent ? "#bbf7d0" : "#fef08a"}`,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          className={`badge ${isSent ? (n.previewUrl ? "badge-gold" : "badge-green") : isFailed ? "badge-maroon" : "badge-gold"}`}
                          style={{ fontSize: "0.74rem" }}
                        >
                          {isSent
                            ? (n.previewUrl ? "🧪 Sandbox Test (Ethereal)" : "✓ Delivered to Real Inbox")
                            : isFailed
                            ? "⚠️ Delivery Failed"
                            : "⏳ Pending"}
                        </span>

                        {n.smtpMessageId && (
                          <span style={{ color: isSent && !n.previewUrl ? "#065f46" : "var(--ink-soft)", fontFamily: "monospace", fontSize: "0.74rem" }}>
                            MsgID: {n.smtpMessageId.slice(0, 24)}...
                          </span>
                        )}

                        {n.errorDetails && (
                          <span style={{ color: "#991b1b", fontSize: "0.78rem" }}>
                            Error: {n.errorDetails} (Attempts: {n.attempts || 1})
                          </span>
                        )}

                        {n.previewUrl ? (
                          <a
                            href={n.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#92400e",
                              fontWeight: 600,
                              textDecoration: "underline",
                              fontSize: "0.76rem",
                            }}
                          >
                            View Ethereal Sandbox Message ↗
                          </a>
                        ) : isSent ? (
                          <span style={{ color: "#065f46", fontSize: "0.74rem", fontWeight: 600 }}>
                            Sent via Gmail SMTP
                          </span>
                        ) : null}
                      </div>

                      {isFailed && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRetryDelivery(n.id || n._id)}
                          disabled={retryingId === (n.id || n._id)}
                          style={{
                            fontSize: "0.78rem",
                            padding: "4px 10px",
                            backgroundColor: "#fee2e2",
                            borderColor: "#fca5a5",
                            color: "#991b1b",
                          }}
                        >
                          {retryingId === (n.id || n._id) ? "Retrying..." : "🔄 Retry Delivery"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    {n.link && (
                      <Link to={n.link} className="btn btn-ghost btn-sm" style={{ whiteSpace: "nowrap" }}>
                        View Linked Record ↗
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleMarkRead(n.id)}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {t("common_confirm") || "Mark as Read"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


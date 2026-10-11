import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";

let cachedTransporter = null;
let lastConfigKey = "";
let cachedIsEthereal = false;

/**
 * Initializes and returns the active Nodemailer SMTP Transporter.
 * Supports production Gmail SMTP credentials from .env.
 * Disables automatic Ethereal fallback: Ethereal test sandbox is ONLY used
 * when EMAIL_TEST_MODE=true is explicitly configured in .env.
 * Otherwise, requires valid EMAIL_USER and EMAIL_PASS and fails clearly if missing.
 */
export async function getTransporter() {
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const user = process.env.EMAIL_USER ? String(process.env.EMAIL_USER).trim() : "";
  // Strip whitespace from App Passwords so 4x4 format "abcd efgh ijkl mnop" works cleanly
  const pass = process.env.EMAIL_PASS ? String(process.env.EMAIL_PASS).trim().replace(/\s+/g, "") : "";
  const isTestMode = String(process.env.EMAIL_TEST_MODE || "false").trim().toLowerCase() === "true";

  const configKey = `${host}:${port}:${user}:${pass}:${isTestMode}`;

  if (cachedTransporter && configKey === lastConfigKey) {
    return {
      transporter: cachedTransporter,
      isEthereal: cachedIsEthereal,
      user,
      error: null,
    };
  }

  // 1. If valid credentials are provided, configure real Gmail or custom SMTP
  if (user && pass) {
    const isGmail = host.toLowerCase().includes("gmail");
    const transportOptions = isGmail
      ? {
          service: "gmail",
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false,
          },
        };

    const transporter = nodemailer.createTransport(transportOptions);
    cachedTransporter = transporter;
    lastConfigKey = configKey;
    cachedIsEthereal = false;
    console.log(`[SMTP Configured] Real SMTP configured using ${isGmail ? "Gmail service" : `${host}:${port}`} for sender account: ${user}`);
    return {
      transporter,
      isEthereal: false,
      user,
      error: null,
    };
  }

  // 2. If credentials are missing, check if sandbox test mode is explicitly requested
  if (isTestMode) {
    try {
      console.log("[SMTP Test Mode] EMAIL_TEST_MODE=true detected. Provisioning Ethereal sandbox test account...");
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      cachedTransporter = transporter;
      lastConfigKey = configKey;
      cachedIsEthereal = true;
      console.log(`[SMTP Test Mode] Connected to Ethereal sandbox (${testAccount.user}). Warning: Test sandbox only!`);
      return {
        transporter,
        isEthereal: true,
        user: testAccount.user,
        error: null,
      };
    } catch (etherealErr) {
      console.error("[SMTP Warning] Could not connect to Ethereal test service:", etherealErr.message);
      return {
        transporter: null,
        isEthereal: false,
        user: "",
        error: `Ethereal sandbox connection failed: ${etherealErr.message}`,
      };
    }
  }

  // 3. Real email mode intended, but credentials missing! Fail clearly without fallback.
  cachedTransporter = null;
  lastConfigKey = "";
  cachedIsEthereal = false;
  const missingError = "Gmail SMTP credentials missing. Please set EMAIL_USER and EMAIL_PASS (16-character Google App Password) in backend/.env for real email delivery.";
  console.warn(`[SMTP Config Error] ${missingError}`);
  return {
    transporter: null,
    isEthereal: false,
    user: "",
    error: missingError,
  };
}

/**
 * Dispatches an official email via Nodemailer and stores delivery status in MongoDB.
 * Implements strict idempotency to prevent duplicate emails.
 */
export async function sendOfficialActionEmail({
  toEmail,
  recipientName,
  userId,
  actionType,
  propertyTitle,
  referenceId,
  actorName,
  actorRole,
  remarks,
  deedNumber,
  verificationUrl,
  link,
  appointmentDetails,
  forceRetry = false,
}) {
  if (!toEmail) {
    return { success: false, error: "Recipient email address is required." };
  }

  const cleanEmail = String(toEmail).trim().toLowerCase();
  const cleanRef = referenceId || "SYSTEM";
  const idempotencyKey = `${actionType}_${cleanRef}_${cleanEmail}`;

  // 1. Check for Duplicate Email (Idempotency)
  if (!forceRetry) {
    const existingNotification = await Notification.findOne({
      idempotencyKey,
      deliveryStatus: "sent",
    });

    if (existingNotification) {
      console.log(`[Email Skipped] Duplicate email prevented for idempotency key: ${idempotencyKey}`);
      return {
        success: true,
        duplicate: true,
        message: "Email already delivered for this official event.",
        notification: existingNotification,
      };
    }
  }

  const subjectMap = {
    REGISTRATION_SUBMITTED: `[Bhoomi Registry] Application Received: ${propertyTitle}`,
    SURVEY_COMPLETED: `[Bhoomi Registry] Boundary Survey Verified: ${propertyTitle}`,
    SURVEY_FLAGGED: `[Bhoomi Registry] Survey Action Required: ${propertyTitle}`,
    REGISTRAR_APPROVED: `[Bhoomi Registry] Title Deed Approved & Issued: ${propertyTitle}`,
    REGISTRAR_REJECTED: `[Bhoomi Registry] Application Rejected: ${propertyTitle}`,
    DEED_GENERATED: `[Bhoomi Registry] Digital Title Deed Generated: ${deedNumber || propertyTitle}`,
    TRANSFER_REQUESTED: `[Bhoomi Registry] Ownership Transfer Request Initiated: ${propertyTitle}`,
    TRANSFER_APPROVED: `[Bhoomi Registry] Ownership Transfer Approved & Executed: ${propertyTitle}`,
    TRANSFER_REJECTED: `[Bhoomi Registry] Ownership Transfer Rejected: ${propertyTitle}`,
    APPOINTMENT_SCHEDULED: `[Bhoomi Registry] Official Hearing Scheduled: ${referenceId}`,
    APPOINTMENT_UPDATED: `[Bhoomi Registry] Appointment Status Update: ${referenceId}`,
  };

  const subject = subjectMap[actionType] || `[Bhoomi Registry] Official Update: ${cleanRef}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f5; margin: 0; padding: 20px; color: #1c2621; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #d8e2dc; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #143325; color: #f6f2e8; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #c9933b; }
        .content { padding: 28px 24px; }
        .meta-box { background: #eaf1ed; border-left: 4px solid #1e4d38; padding: 14px 16px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .meta-box p { margin: 4px 0; font-size: 14px; }
        .btn { display: inline-block; background: #1e4d38; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
        .footer { background: #f6f2e8; padding: 16px 24px; font-size: 12px; color: #526359; text-align: center; border-top: 1px solid #e1e8e4; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>BHOOMI LAND REGISTRY</h1>
          <p>Official Department of Land Records & Title Management</p>
        </div>
        <div class="content">
          <p>Dear <strong>${recipientName || "Citizen"}</strong>,</p>
          <p>An official action has been processed in the Bhoomi Land Registry system:</p>
          
          <div class="meta-box">
            ${propertyTitle ? `<p><strong>Property Title:</strong> ${propertyTitle}</p>` : ""}
            <p><strong>Reference ID:</strong> ${cleanRef}</p>
            <p><strong>Action Type:</strong> ${actionType.replace(/_/g, " ")}</p>
            ${actorName ? `<p><strong>Processed By:</strong> ${actorName} (${actorRole || "Official"})</p>` : ""}
            ${remarks ? `<p><strong>Official Remarks:</strong> "${remarks}"</p>` : ""}
            ${deedNumber ? `<p><strong>Issued Digital Deed Number:</strong> <span style="font-family: monospace; font-size: 15px; color: #1e4d38; font-weight: bold;">${deedNumber}</span></p>` : ""}
            ${appointmentDetails ? `<p><strong>Appointment Date/Time:</strong> ${appointmentDetails.dateTime || "Scheduled"}</p><p><strong>Venue:</strong> ${appointmentDetails.venue || "Sub-Registrar Office"}</p>` : ""}
          </div>

          ${
            verificationUrl
              ? `<p>You can verify your official digital deed and download the publication-grade PDF certificate:</p>
                 <p><a href="${verificationUrl}" class="btn">View & Download Digital Deed</a></p>`
              : ""
          }

          <p style="margin-top: 24px; font-size: 13px; color: #526359;">
            This is an authentic official notice generated under the Registration Act and Information Technology Act.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Bhoomi Registry Portal • Government of Tamil Nadu</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Determine Notification Type
  const notifTypeMap = {
    REGISTRATION_SUBMITTED: "registration",
    SURVEY_COMPLETED: "survey",
    SURVEY_FLAGGED: "survey",
    REGISTRAR_APPROVED: "approval",
    REGISTRAR_REJECTED: "approval",
    DEED_GENERATED: "deed",
    TRANSFER_REQUESTED: "transfer",
    TRANSFER_APPROVED: "transfer",
    TRANSFER_REJECTED: "transfer",
    APPOINTMENT_SCHEDULED: "appointment",
    APPOINTMENT_UPDATED: "appointment",
  };
  const type = notifTypeMap[actionType] || "system";

  // 2. Prepare / Find Notification Record in MongoDB
  let notification = await Notification.findOne({ idempotencyKey });
  if (!notification) {
    notification = new Notification({
      id: `N-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: userId || "SYSTEM",
      recipientEmail: cleanEmail,
      recipientName: recipientName || "Citizen",
      title: subject.replace("[Bhoomi Registry] ", ""),
      body: remarks || `Action ${actionType} recorded for reference ${cleanRef}.`,
      date: new Date().toISOString().slice(0, 10),
      link: verificationUrl || link || `/track?ref=${cleanRef}`,
      type,
      actionType,
      referenceId: cleanRef,
      propertyTitle: propertyTitle || "",
      deliveryStatus: "pending",
      emailSent: false,
      attempts: 1,
      lastAttemptAt: new Date(),
      idempotencyKey,
    });
  } else {
    notification.attempts += 1;
    notification.lastAttemptAt = new Date();
  }

  // 3. Send over live SMTP using Nodemailer
  const { transporter, isEthereal, user: senderUser, error: transportError } = await getTransporter();

  if (!transporter) {
    const errorMsg = transportError || "SMTP credentials not configured in backend/.env";
    notification.deliveryStatus = "failed";
    notification.emailSent = false;
    notification.errorDetails = errorMsg;
    await notification.save();
    return {
      success: false,
      error: errorMsg,
      notification,
    };
  }

  // Ensure From header matches authenticated Gmail account to prevent SPF/DMARC rejection
  const from = process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("noreply@bhoomi.gov.in")
    ? process.env.EMAIL_FROM
    : (senderUser ? `"Bhoomi Land Registry" <${senderUser}>` : '"Bhoomi Land Registry" <noreply@bhoomi.gov.in>');

  try {
    const info = await transporter.sendMail({
      from,
      to: cleanEmail,
      subject,
      html: htmlContent,
    });

    // ONLY set previewUrl if in sandbox test mode with Ethereal!
    // Never mark an Ethereal preview as a real recipient email!
    const previewUrl = isEthereal ? (nodemailer.getTestMessageUrl(info) || "") : "";

    notification.deliveryStatus = "sent";
    notification.emailSent = true;
    notification.smtpMessageId = info.messageId || "SMTP-SENT";
    notification.previewUrl = previewUrl;
    notification.errorDetails = "";
    await notification.save();

    console.log(`[Email Service] ${isEthereal ? "[SANDBOX TEST]" : "[REAL GMAIL INBOX]"} email sent to ${cleanEmail}. Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[Email Service Sandbox] Ethereal Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      isEthereal,
      notification,
    };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send email to ${cleanEmail}:`, err.message);
    let friendlyError = err.message;
    if (err.message && err.message.includes("Username and Password not accepted")) {
      friendlyError = "Gmail authentication rejected. Please ensure 2-Step Verification is enabled and use a 16-character Google App Password in EMAIL_PASS (not your standard Google account password).";
    }

    notification.deliveryStatus = "failed";
    notification.emailSent = false;
    notification.errorDetails = friendlyError;
    await notification.save();

    return {
      success: false,
      error: friendlyError,
      notification,
    };
  }
}

/**
 * Retries dispatch of an existing failed notification.
 */
export async function retryNotificationEmail(notificationId) {
  const query = mongoose.Types.ObjectId.isValid(notificationId)
    ? { $or: [{ id: notificationId }, { _id: notificationId }] }
    : { id: notificationId };
  const notification = await Notification.findOne(query);

  if (!notification) {
    throw new Error("Notification record not found.");
  }

  return await sendOfficialActionEmail({
    toEmail: notification.recipientEmail,
    recipientName: notification.recipientName,
    userId: notification.userId,
    actionType: notification.actionType,
    propertyTitle: notification.propertyTitle,
    referenceId: notification.referenceId,
    remarks: notification.body,
    verificationUrl: notification.link?.includes("verify-deed") ? notification.link : undefined,
    link: notification.link,
    forceRetry: true,
  });
}

/**
 * Verifies the SMTP connection and authentication status.
 */
export async function verifySmtpConnection() {
  const { transporter, isEthereal, user, error } = await getTransporter();
  if (!transporter) {
    return {
      success: false,
      isEthereal: false,
      error: error || "SMTP credentials not configured in backend/.env",
    };
  }

  try {
    await transporter.verify();
    return {
      success: true,
      isEthereal,
      service: isEthereal ? "Ethereal Test Sandbox" : "Gmail / Live SMTP",
      user,
    };
  } catch (err) {
    let friendlyError = err.message;
    if (err.message && err.message.includes("Username and Password not accepted")) {
      friendlyError = "Gmail authentication rejected: Ensure 2-Step Verification is ON and use a 16-character Google App Password in EMAIL_PASS.";
    }
    return {
      success: false,
      isEthereal,
      error: friendlyError,
    };
  }
}

/**
 * Sends a real test email to an inbox to verify live delivery.
 */
export async function testSendEmail(toEmail, recipientName = "Citizen") {
  return await sendOfficialActionEmail({
    toEmail,
    recipientName,
    userId: "TEST_DIAGNOSTICS",
    actionType: "REGISTRATION_SUBMITTED",
    propertyTitle: "Bhoomi Registry Diagnostics Parcel #104",
    referenceId: `TEST-${Date.now().toString().slice(-4)}`,
    actorName: "System Diagnostics",
    actorRole: "Official Sub-Registrar",
    remarks: "This is a real live test email verifying Gmail SMTP delivery in the Bhoomi Land Registry portal.",
    forceRetry: true,
  });
}

// test_real_email.js
// CLI tool to verify Gmail SMTP configuration and test delivery to a real inbox.
// Usage: node test_real_email.js [target_email@example.com]

import dotenv from "dotenv";
import mongoose from "mongoose";
import { testSendEmail, verifySmtpConnection } from "./services/emailService.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_STRING || "mongodb://127.0.0.1:27017/bhoomi_land_registry";

async function main() {
  console.log("================================================================================");
  console.log("             BHOOMI REGISTRY - REAL GMAIL SMTP DELIVERY DIAGNOSTIC              ");
  console.log("================================================================================\n");

  const emailUser = (process.env.EMAIL_USER || "").trim();
  const emailPass = (process.env.EMAIL_PASS || "").trim();
  const testMode = String(process.env.EMAIL_TEST_MODE || "false").trim().toLowerCase() === "true";

  console.log("--> Current Configuration in backend/.env:");
  console.log(`    EMAIL_HOST     : ${process.env.EMAIL_HOST || "smtp.gmail.com"}`);
  console.log(`    EMAIL_PORT     : ${process.env.EMAIL_PORT || "587"}`);
  console.log(`    EMAIL_USER     : ${emailUser ? emailUser : "[MISSING / NOT CONFIGURED]"}`);
  console.log(`    EMAIL_PASS     : ${emailPass ? "******** (configured, " + emailPass.length + " chars)" : "[MISSING / NOT CONFIGURED]"}`);
  console.log(`    EMAIL_TEST_MODE: ${testMode ? "true (SANDBOX)" : "false (REAL INBOX MODE ENFORCED)"}\n`);

  if (!emailUser || !emailPass) {
    if (!testMode) {
      console.error(" [FAIL] REAL GMAIL DELIVERY CANNOT PROCEED WITHOUT CREDENTIALS");
      console.log("\n================================================================================");
      console.log(" HOW TO CONFIGURE YOUR GMAIL APP PASSWORD:");
      console.log(" 1. Go to Google Account Security: https://myaccount.google.com/security");
      console.log(" 2. Ensure '2-Step Verification' is turned ON.");
      console.log(" 3. Go directly to: https://myaccount.google.com/apppasswords");
      console.log(" 4. Create an app named 'Bhoomi Registry'.");
      console.log(" 5. Copy the 16-character code (e.g. 'abcd efgh ijkl mnop') and paste into backend/.env:");
      console.log("      EMAIL_USER=your_email@gmail.com");
      console.log("      EMAIL_PASS=your_16_character_app_password");
      console.log(" 6. Run this test again: node test_real_email.js your_email@gmail.com");
      console.log("================================================================================\n");
      process.exit(1);
    } else {
      console.warn(" [WARN] Running in Ethereal Test Sandbox mode because EMAIL_TEST_MODE=true is set.");
    }
  }

  // Connect to DB
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log("--> Connected to MongoDB successfully.\n");
    }
  } catch (dbErr) {
    console.error(" [FAIL] Could not connect to MongoDB:", dbErr.message);
    process.exit(1);
  }

  // Step 1: Verify SMTP Connection
  console.log("--> Step 1: Verifying SMTP Connection & Authentication...");
  const status = await verifySmtpConnection();

  if (!status.success) {
    console.error(` [FAIL] SMTP Verification Failed: ${status.error}`);
    process.exit(1);
  }

  console.log(` [PASS] SMTP Verified successfully!`);
  console.log(`        Service: ${status.service}`);
  console.log(`        Account: ${status.user}\n`);

  // Step 2: Send Test Email
  const targetEmail = process.argv[2] || emailUser || "test@example.com";
  console.log(`--> Step 2: Dispatching Real Test Email to: ${targetEmail}`);

  const sendResult = await testSendEmail(targetEmail, "Bhoomi Official Tester");

  if (!sendResult.success) {
    console.error(` [FAIL] Test email delivery failed: ${sendResult.error}`);
    process.exit(1);
  }

  console.log(` [PASS] Email successfully sent!`);
  console.log(`        Message ID     : ${sendResult.messageId}`);
  console.log(`        Delivery Status: ${sendResult.notification?.deliveryStatus}`);
  console.log(`        Recipient      : ${targetEmail}`);
  console.log(`        Is Real Delivery: ${!sendResult.isEthereal ? "YES (Real Inbox)" : "NO (Sandbox Preview)"}`);
  if (sendResult.previewUrl) {
    console.log(`        Sandbox URL    : ${sendResult.previewUrl}`);
  } else {
    console.log(`        Preview URL    : None (Real recipient email delivered directly to mailbox)`);
  }

  console.log("\n================================================================================");
  console.log(" RESULT: Real Gmail SMTP delivery is operational and verified!");
  console.log("================================================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

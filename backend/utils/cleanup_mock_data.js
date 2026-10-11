import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { Registration } from "../models/Registration.js";
import { Deed } from "../models/Deed.js";
import { PropertyTransfer } from "../models/PropertyTransfer.js";
import { Document } from "../models/Document.js";
import { Payment } from "../models/Payment.js";
import { Appointment } from "../models/Appointment.js";
import { Notification } from "../models/Notification.js";
import { ActionLog } from "../models/ActionLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_STRING || "mongodb://localhost:27017/bhoomi_land_registry";

async function cleanup() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const mockEmails = [
    "citizen@demo.in",
    "meena@demo.in",
    "officer@demo.in",
    "surveyor@demo.in",
    "lawyer@demo.in",
    "admin@demo.in",
    "test.google@demo.in",
    "ananya.citizen@gmail.com",
    "ramesh.surveyor@gmail.com",
    "priya.registrar@gmail.com",
    "alex.citizen@gmail.com",
    "rajesh.registrar@gmail.com",
    "priya.surveyor@gmail.com",
    "adv.sneha@gmail.com",
    "suresh.admin@gmail.com",
  ];

  const mockUsers = await User.find({
    $or: [{ email: { $in: mockEmails } }, { email: { $regex: /@demo\.in$/i } }],
  });
  const mockUserIds = mockUsers.map((u) => u.id);
  console.log(`Found ${mockUsers.length} mock users to remove.`);

  // Delete mock users
  await User.deleteMany({
    $or: [{ email: { $in: mockEmails } }, { email: { $regex: /@demo\.in$/i } }],
  });

  // Delete mock properties
  const deletedProps = await Property.deleteMany({
    $or: [{ ownerEmail: { $in: mockEmails } }, { ownerEmail: { $regex: /@demo\.in$/i } }, { ownerId: { $in: mockUserIds } }],
  });
  console.log(`Deleted ${deletedProps.deletedCount} mock properties.`);

  // Delete mock registrations
  const deletedRegs = await Registration.deleteMany({
    $or: [{ applicantEmail: { $in: mockEmails } }, { applicantEmail: { $regex: /@demo\.in$/i } }, { applicantId: { $in: mockUserIds } }],
  });
  console.log(`Deleted ${deletedRegs.deletedCount} mock registrations.`);

  // Delete mock deeds, transfers, documents, payments, appointments, notifications, actionlogs
  await Deed.deleteMany({
    $or: [{ ownerId: { $in: mockUserIds } }, { deedNumber: "DEED-2025-78219" }],
  });
  await PropertyTransfer.deleteMany({
    $or: [{ fromOwner: "Karthik Raman" }, { toEmail: { $in: mockEmails } }],
  });
  await Document.deleteMany({
    $or: [{ userId: { $in: mockUserIds } }, { uploadedBy: "Karthik Raman" }],
  });
  await Payment.deleteMany({
    $or: [{ relatedTo: { $in: ["REG-2026-0001", "REG-2026-0002", "REG-2026-8491"] } }],
  });
  await Appointment.deleteMany({
    $or: [{ userId: { $in: mockUserIds } }, { citizenName: "Meena Suresh" }],
  });
  await Notification.deleteMany({
    $or: [{ userId: { $in: mockUserIds } }],
  });
  await ActionLog.deleteMany({
    $or: [{ emailSentTo: { $in: mockEmails } }, { emailSentTo: { $regex: /@demo\.in$/i } }],
  });

  // Ensure an official System Administrator user exists
  const existingAdmin = await User.findOne({ email: "admin@bhoomi.gov.in" });
  if (!existingAdmin) {
    await User.create({
      id: "U-ADMIN-01",
      fullName: "System Administrator",
      email: "admin@bhoomi.gov.in",
      password: "Admin@Bhoomi2026!",
      role: "admin",
      phone: "+91 90000 00001",
      isActive: true,
    });
    console.log("Created official System Administrator account (admin@bhoomi.gov.in).");
  }

  // Display remaining real users
  const remainingUsers = await User.find({}, "id email fullName role googleId");
  console.log("Remaining real users in DB:", remainingUsers);

  console.log("Cleanup completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

cleanup().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});

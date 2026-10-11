import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_STRING || "mongodb://127.0.0.1:27017/bhoomi_land_registry";

export async function seedDatabase(force = false) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    // Ensure system administrator exists
    const adminEmail = "admin@bhoomi.gov.in";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        id: "U-ADMIN-01",
        fullName: "System Administrator",
        email: adminEmail,
        password: "Admin@Bhoomi2026!",
        role: "admin",
        phone: "+91 90000 00001",
        isActive: true,
      });
      console.log(`[Database Seeder] Initialized official Administrator (${adminEmail}).`);
    }

    // Ensure official Sub-Registrar exists
    const registrarEmail = "officer@bhoomi.gov.in";
    const existingRegistrar = await User.findOne({ email: registrarEmail });
    if (!existingRegistrar) {
      await User.create({
        id: "U-REG-01",
        fullName: "S. Anand, Sub-Registrar",
        email: registrarEmail,
        password: "Officer@Bhoomi2026!",
        role: "officer",
        office: "Madurai South Sub-Registrar Office",
        phone: "+91 94432 10001",
        isActive: true,
      });
      console.log(`[Database Seeder] Initialized Sub-Registrar (${registrarEmail}).`);
    }

    // Ensure licensed Surveyor exists
    const surveyorEmail = "surveyor@bhoomi.gov.in";
    const existingSurveyor = await User.findOne({ email: surveyorEmail });
    if (!existingSurveyor) {
      await User.create({
        id: "U-SURV-01",
        fullName: "P. Lakshmi, Licensed Surveyor",
        email: surveyorEmail,
        password: "Surveyor@Bhoomi2026!",
        role: "surveyor",
        license: "TN-SURV-2024-8819",
        phone: "+91 94432 10002",
        isActive: true,
      });
      console.log(`[Database Seeder] Initialized Licensed Surveyor (${surveyorEmail}).`);
    }

    // Ensure verified Advocate/Lawyer exists
    const lawyerEmail = "lawyer@bhoomi.gov.in";
    const existingLawyer = await User.findOne({ email: lawyerEmail });
    if (!existingLawyer) {
      await User.create({
        id: "U-LAW-01",
        fullName: "R. Jayaram, Senior Advocate",
        email: lawyerEmail,
        password: "Lawyer@Bhoomi2026!",
        role: "lawyer",
        barId: "TN/BAR/2018/4921",
        phone: "+91 94432 10003",
        isActive: true,
      });
      console.log(`[Database Seeder] Initialized Senior Advocate (${lawyerEmail}).`);
    }

  } catch (err) {
    console.error("[Database Seeder Error]", err);
  }
}

if (process.argv[1]?.endsWith("seeder.js")) {
  seedDatabase(true).then(() => {
    console.log("Seeding complete. Exiting...");
    process.exit(0);
  });
}

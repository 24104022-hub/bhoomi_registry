import { Registration } from "../models/Registration.js";
import { ActionLog } from "../models/ActionLog.js";
import { Notification } from "../models/Notification.js";
import { Payment } from "../models/Payment.js";
import { Document } from "../models/Document.js";

import { generateUniqueRegistrationId } from "../utils/idGenerator.js";
import { sendOfficialActionEmail } from "../services/emailService.js";

export async function createRegistration(req, res) {
  const {
    propertyTitle,
    type,
    areaSqft,
    address,
    coordinates,
    estValue,
    registrationDate,
    surveyNumber,
    boundaries: reqBoundaries,
    docName,
    paymentMethod,
    paid,
  } = req.body;

  if (!propertyTitle || !address || !areaSqft) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all mandatory property fields (title, area, and address).",
    });
  }

  const newId = await generateUniqueRegistrationId();

  const applicantId = req.user ? req.user.id : req.body.applicantId;
  const applicantName = req.user ? req.user.fullName : (req.body.applicantName || "Citizen Applicant");
  const applicantEmail = req.user ? req.user.email : req.body.applicantEmail;

  if (!applicantEmail || !applicantId) {
    return res.status(401).json({ success: false, message: "Authentication required to submit property registration." });
  }

  const boundaries = {
    north: reqBoundaries?.north || (address ? `North boundary of ${address.split(",")[0]}` : "Plot No. 104 Road"),
    south: reqBoundaries?.south || "Adjacent Survey Plot",
    east: reqBoundaries?.east || "40 Feet Revenue Road",
    west: reqBoundaries?.west || "Adjoining Boundary Line",
  };

  const cleanSurveyNumber = surveyNumber || `SURV-${Math.floor(100 + Math.random() * 900)}/A`;

  const registration = await Registration.create({
    id: newId,
    propertyTitle,
    type: type || "Residential",
    areaSqft: Number(areaSqft) || 0,
    address,
    coordinates: {
      lat: Number(coordinates?.lat) || 9.9252,
      lng: Number(coordinates?.lng) || 78.1198,
    },
    estValue: Number(estValue) || 0,
    registrationDate: registrationDate || new Date().toISOString().slice(0, 10),
    surveyNumber: cleanSurveyNumber,
    boundaries,
    applicantId,
    applicantName,
    applicantEmail,
    status: "pending",
    submittedOn: new Date().toISOString().slice(0, 10),
    surveyorAssigned: req.body.surveyorAssigned || "Pending Field Surveyor Assignment",
    officerAssigned: req.body.officerAssigned || "Pending Sub-Registrar Assignment",
    timeline: [
      {
        stage: "Citizen Registration Submitted",
        status: "pending",
        performedBy: applicantName,
        role: "citizen",
        remarks: "Application submitted with land parcel details and map coordinates.",
        date: new Date(),
      },
    ],
  });

  // Record ActionLog
  await ActionLog.create({
    entityType: "registration",
    entityId: newId,
    action: "REGISTRATION_SUBMITTED",
    performedBy: applicantName,
    role: "citizen",
    previousStatus: "draft",
    newStatus: "pending",
    remarks: "New registration application submitted with GPS coordinates.",
  });

  // Create document entry if provided
  if (docName) {
    await Document.create({
      id: `DOC-${Math.floor(7000 + Math.random() * 3000)}`,
      name: docName,
      relatedTo: newId,
      category: "Deed",
      status: "pending",
      uploadedOn: new Date().toISOString().slice(0, 10),
      uploadedBy: applicantName,
      userId: applicantId,
    });
  }

  // Create payment record
  const fee = Math.round((Number(estValue) || 0) * 0.015) || 5000;
  await Payment.create({
    id: `PAY-${Math.floor(5000 + Math.random() * 5000)}`,
    relatedTo: newId,
    description: "Property Registration & Stamp Duty Fee (1.5%)",
    amount: fee,
    method: paymentMethod || "UPI",
    status: paid ? "paid" : "due",
    date: new Date().toISOString().slice(0, 10),
  });

  // Create official notification and dispatch email via Nodemailer SMTP
  if (applicantEmail) {
    await sendOfficialActionEmail({
      toEmail: applicantEmail,
      recipientName: applicantName,
      userId: applicantId,
      actionType: "REGISTRATION_SUBMITTED",
      propertyTitle: registration.propertyTitle,
      referenceId: newId,
      actorName: applicantName,
      actorRole: "Citizen Applicant",
      remarks: `Registration application ${newId} received for ${propertyTitle}. Assigned to Licensed Surveyor for boundary verification.`,
      link: `/track?ref=${newId}`,
    });
  }

  res.status(201).json({
    success: true,
    data: registration,
  });
}

export async function getRegistrations(req, res) {
  const { status, applicantId } = req.query;
  const filter = {};

  if (status && status !== "all") {
    filter.status = status;
  }

  // If citizen, only view their own registrations
  if (req.user && req.user.role === "citizen") {
    filter.applicantId = req.user.id;
  } else if (applicantId) {
    filter.applicantId = applicantId;
  }

  const registrations = await Registration.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
}

export async function getRegistrationById(req, res) {
  const { id } = req.params;
  const registration = await Registration.findOne({ id });

  if (!registration) {
    return res.status(404).json({ success: false, message: "Registration not found." });
  }

  if (req.user && req.user.role === "citizen" && registration.applicantId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: You do not have authorization to view another citizen's application.",
    });
  }

  res.json({
    success: true,
    data: registration,
  });
}

export async function trackApplication(req, res) {
  const { ref } = req.params;
  const cleanRef = String(ref || "").trim();

  // Try registration
  const reg = await Registration.findOne({
    $or: [{ id: new RegExp(`^${cleanRef}$`, "i") }, { deedNumber: new RegExp(`^${cleanRef}$`, "i") }],
  });

  if (reg) {
    return res.json({
      success: true,
      kind: "registration",
      record: reg,
    });
  }

  // Try property
  const prop = await Property.findOne({
    $or: [{ id: new RegExp(`^${cleanRef}$`, "i") }, { deedNumber: new RegExp(`^${cleanRef}$`, "i") }],
  });

  if (prop) {
    return res.json({
      success: true,
      kind: "property",
      record: prop,
    });
  }

  res.status(404).json({
    success: false,
    message: `No application, deed, or property found matching reference '${cleanRef}'.`,
  });
}

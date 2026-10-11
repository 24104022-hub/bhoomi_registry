import { Registration } from "../models/Registration.js";
import { Property } from "../models/Property.js";
import { Deed } from "../models/Deed.js";
import { ActionLog } from "../models/ActionLog.js";
import { Notification } from "../models/Notification.js";
import { generateDeedHash } from "../utils/cryptoUtils.js";
import { generateUniqueDeedNumber, generateUniquePropertyId } from "../utils/idGenerator.js";
import { generateDeedQRCode } from "../services/qrService.js";
import { sendOfficialActionEmail } from "../services/emailService.js";

export async function getRegistrarQueue(req, res) {
  const registrations = await Registration.find({
    status: { $in: ["surveyVerified", "underReview", "pending"] },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
}

export async function approveRegistration(req, res) {
  const { id } = req.params;
  const { remarks, office } = req.body;

  const registration = await Registration.findOne({ id });
  if (!registration) {
    return res.status(404).json({ success: false, message: "Registration not found." });
  }

  // Prevent duplicate approval and redundant deed generation
  if (registration.status === "approved" && registration.deedNumber) {
    const existingDeed = await Deed.findOne({ deedNumber: registration.deedNumber });
    const existingProperty = await Property.findOne({ deedNumber: registration.deedNumber });
    return res.status(400).json({
      success: false,
      message: `Application ${id} has already been approved. Deed ${registration.deedNumber} was already issued.`,
      data: {
        registration,
        deed: existingDeed,
        property: existingProperty,
      },
    });
  }

  const registrarName = req.user?.fullName || "Sub-Registrar Officer";
  const registrarOffice = office || req.user?.office || "Sub-Registrar Office";
  const deedNumber = await generateUniqueDeedNumber();
  const propertyId = await generateUniquePropertyId();

  const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { qrDataUrl, verificationUrl } = await generateDeedQRCode(deedNumber, frontendBaseUrl);

  const issueDate = new Date();
  const boundaries = {
    north: registration.boundaries?.north || (registration.address ? `North boundary of ${registration.address.split(",")[0]}` : "Boundary Road"),
    south: registration.boundaries?.south || "Adjacent Survey Plot",
    east: registration.boundaries?.east || "40 Feet Revenue Road",
    west: registration.boundaries?.west || "Adjoining Boundary Line",
  };
  const surveyNumber = registration.surveyNumber || registration.surveyDetails?.surveyNo || "SURV-228/4A";
  const registrationDate = registration.registrationDate || registration.submittedOn || new Date().toISOString().slice(0, 10);

  // Generate SHA-256 digital signature hash over all essential deed parameters
  const digitalSignatureHash = generateDeedHash({
    deedNumber,
    propertyId,
    registrationId: registration.id,
    ownerId: registration.applicantId,
    ownerName: registration.applicantName,
    areaSqft: registration.areaSqft,
    surveyNumber,
    boundaries,
    address: registration.address,
    coordinates: registration.coordinates,
    issueDate: issueDate.toISOString(),
    registrarName,
    registrarOffice,
  });

  // Create Deed in MongoDB
  const deed = await Deed.create({
    deedNumber,
    propertyId,
    registrationId: registration.id,
    ownerId: registration.applicantId,
    ownerName: registration.applicantName,
    propertyTitle: registration.propertyTitle,
    propertyType: registration.type,
    areaSqft: registration.areaSqft,
    address: registration.address,
    coordinates: registration.coordinates,
    boundaries,
    estValue: registration.estValue,
    registrationDate,
    issueDate,
    surveyNumber,
    surveyorName: registration.surveyDetails?.surveyorName || registration.surveyorAssigned,
    registrarName,
    registrarOffice,
    approvalRemarks: remarks || "Application scrutinized, cadastral boundaries verified, and title deed granted.",
    digitalSignatureHash,
    verificationUrl,
    qrCodeDataUrl: qrDataUrl,
    status: "active",
  });

  // Create Property in MongoDB
  const property = await Property.create({
    id: propertyId,
    parcelId: `LP-${deedNumber.replace("DEED-", "")}`,
    title: registration.propertyTitle,
    type: registration.type,
    areaSqft: registration.areaSqft,
    address: registration.address,
    coordinates: registration.coordinates,
    boundaries,
    surveyNumber,
    estValue: registration.estValue,
    ownerId: registration.applicantId,
    ownerName: registration.applicantName,
    ownerEmail: registration.applicantEmail,
    registered: true,
    registeredOn: new Date().toISOString().slice(0, 10),
    status: "approved",
    deedNumber,
    registrationId: registration.id,
    surveyDetails: registration.surveyDetails,
    registrarRemarks: remarks || "Application scrutinized and title deed granted.",
    timeline: [
      ...registration.timeline,
      {
        stage: "Registrar Approval & Title Deed Issuance",
        status: "approved",
        performedBy: registrarName,
        role: "officer",
        remarks: remarks || `Digital title deed ${deedNumber} issued and sealed.`,
        date: new Date(),
      },
    ],
  });

  // Update Registration record
  registration.status = "approved";
  registration.deedNumber = deedNumber;
  registration.propertyId = propertyId;
  registration.boundaries = boundaries;
  registration.surveyNumber = surveyNumber;
  registration.officerRemarks = remarks || "Title deed granted.";
  registration.timeline.push({
    stage: "Registrar Approval & Digital Deed Issued",
    status: "approved",
    performedBy: registrarName,
    role: "officer",
    remarks: remarks || `Digital deed ${deedNumber} generated with verifiable QR code.`,
    date: new Date(),
  });
  await registration.save();

  // Record ActionLog
  await ActionLog.create({
    entityType: "registration",
    entityId: id,
    action: "REGISTRAR_APPROVED",
    performedBy: registrarName,
    role: "officer",
    previousStatus: registration.status,
    newStatus: "approved",
    remarks: remarks || `Deed ${deedNumber} issued`,
    emailSentTo: registration.applicantEmail,
  });

  // Automatically dispatch email notification & register official delivery record in DB
  if (registration.applicantEmail) {
    await sendOfficialActionEmail({
      toEmail: registration.applicantEmail,
      recipientName: registration.applicantName,
      userId: registration.applicantId,
      actionType: "REGISTRAR_APPROVED",
      propertyTitle: registration.propertyTitle,
      referenceId: registration.id,
      actorName: registrarName,
      actorRole: "Sub-Registrar",
      remarks: remarks || "All documents verified and deed registered into State Cadastral Archives.",
      deedNumber,
      verificationUrl,
    });
  } else {
    await Notification.create({
      id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: registration.applicantId,
      title: "Registration Approved — Digital Deed Issued!",
      body: `Your property '${registration.propertyTitle}' has been approved by ${registrarName}. Deed No: ${deedNumber}.`,
      date: new Date().toISOString().slice(0, 10),
      link: `/verify-deed/${deedNumber}`,
      type: "approval",
    });
  }

  res.json({
    success: true,
    message: "Registration successfully approved and Digital Deed issued!",
    data: {
      registration,
      deed,
      property,
    },
  });
}

export async function rejectRegistration(req, res) {
  const { id } = req.params;
  const { remarks } = req.body;

  const registration = await Registration.findOne({ id });
  if (!registration) {
    return res.status(404).json({ success: false, message: "Registration not found." });
  }

  const registrarName = req.user?.fullName || "Sub-Registrar Officer";
  const prevStatus = registration.status;

  registration.status = "rejected";
  registration.officerRemarks = remarks || "Application rejected due to document or boundary discrepancy.";
  registration.timeline.push({
    stage: "Registrar Review — Application Rejected",
    status: "rejected",
    performedBy: registrarName,
    role: "officer",
    remarks: remarks || "Application rejected. Review official remarks and resubmit required documents.",
    date: new Date(),
  });
  await registration.save();

  // Record ActionLog
  await ActionLog.create({
    entityType: "registration",
    entityId: id,
    action: "REGISTRAR_REJECTED",
    performedBy: registrarName,
    role: "officer",
    previousStatus: prevStatus,
    newStatus: "rejected",
    remarks: remarks || "",
    emailSentTo: registration.applicantEmail,
  });

  // Automatically dispatch email notification & register official delivery record in DB
  if (registration.applicantEmail) {
    await sendOfficialActionEmail({
      toEmail: registration.applicantEmail,
      recipientName: registration.applicantName,
      userId: registration.applicantId,
      actionType: "REGISTRAR_REJECTED",
      propertyTitle: registration.propertyTitle,
      referenceId: registration.id,
      actorName: registrarName,
      actorRole: "Sub-Registrar",
      remarks: remarks || "Document inconsistency or boundary discrepancy noted.",
    });
  } else {
    await Notification.create({
      id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: registration.applicantId,
      title: "Registration Application Rejected",
      body: `Your registration for ${registration.propertyTitle} was rejected by ${registrarName}. Remarks: ${remarks || "None"}`,
      date: new Date().toISOString().slice(0, 10),
      link: `/track?ref=${id}`,
      type: "approval",
    });
  }

  res.json({
    success: true,
    message: "Registration rejected and citizen notified via email.",
    data: registration,
  });
}

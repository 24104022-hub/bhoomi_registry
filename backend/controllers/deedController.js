import { Deed } from "../models/Deed.js";
import { generateDeedPdfBuffer } from "../services/pdfService.js";

export async function getDeedByNumber(req, res) {
  const { deedNumber } = req.params;
  const deed = await Deed.findOne({
    $or: [
      { deedNumber: new RegExp(`^${deedNumber}$`, "i") },
      { propertyId: new RegExp(`^${deedNumber}$`, "i") },
    ],
  });

  if (!deed) {
    return res.status(404).json({ success: false, message: "Digital Deed record not found." });
  }

  res.json({
    success: true,
    data: deed,
  });
}

export async function verifyDeedPublic(req, res) {
  const { deedNumber } = req.params;
  const deed = await Deed.findOne({
    $or: [
      { deedNumber: new RegExp(`^${deedNumber}$`, "i") },
      { propertyId: new RegExp(`^${deedNumber}$`, "i") },
    ],
  });

  if (!deed) {
    return res.status(404).json({
      success: false,
      verified: false,
      message: "Invalid or unrecognized deed identifier. No record found in government registry.",
    });
  }

  // Safe public verification data (do not expose private credentials)
  const isRevoked = deed.status === "revoked";
  const isTransferred = deed.status === "transferred";
  const statusMessage = isRevoked
    ? "WARNING: This Title Deed has been REVOKED by Competent Authority and is VOID."
    : isTransferred
    ? "HISTORICAL NOTICE: This Title has been transferred to a subsequent owner."
    : "OFFICIAL VERIFICATION: This Digital Title Deed is authentic, active, and valid in the State Cadastral Archives.";

  res.json({
    success: true,
    verified: true,
    data: {
      deedNumber: deed.deedNumber,
      propertyId: deed.propertyId,
      registrationId: deed.registrationId,
      propertyTitle: deed.propertyTitle,
      propertyType: deed.propertyType,
      areaSqft: deed.areaSqft,
      address: deed.address,
      coordinates: deed.coordinates,
      surveyNumber: deed.surveyNumber || "Cadastral Survey Parcel",
      boundaries: deed.boundaries || {
        north: "Adjacent Land",
        south: "Adjacent Land",
        east: "Access Roadway",
        west: "Property Boundary",
      },
      ownerName: deed.ownerName,
      ownerId: deed.ownerId,
      registrationDate: deed.registrationDate || (deed.issueDate ? new Date(deed.issueDate).toISOString().slice(0, 10) : ""),
      issueDate: deed.issueDate,
      registrarName: deed.registrarName,
      registrarOffice: deed.registrarOffice,
      surveyorName: deed.surveyorName,
      approvalRemarks: deed.approvalRemarks,
      digitalSignatureHash: deed.digitalSignatureHash,
      status: deed.status,
      statusMessage,
      pdfDownloadUrl: `/api/deeds/${encodeURIComponent(deed.deedNumber)}/pdf`,
      qrCodeDataUrl: deed.qrCodeDataUrl,
      verificationUrl: deed.verificationUrl,
    },
  });
}

export async function updateDeedStatus(req, res) {
  const { deedNumber } = req.params;
  const { status, remarks } = req.body;

  if (!status || !["active", "revoked", "transferred"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Allowed values: active, revoked, transferred.",
    });
  }

  const deed = await Deed.findOne({
    $or: [
      { deedNumber: new RegExp(`^${deedNumber}$`, "i") },
      { propertyId: new RegExp(`^${deedNumber}$`, "i") },
    ],
  });

  if (!deed) {
    return res.status(404).json({ success: false, message: "Deed not found." });
  }

  deed.status = status;
  if (remarks) deed.approvalRemarks = remarks;
  await deed.save();

  return res.json({
    success: true,
    message: `Deed status updated to '${status}'.`,
    data: deed,
  });
}

export async function downloadDeedPdf(req, res) {
  const { deedNumber } = req.params;
  const deed = await Deed.findOne({
    $or: [
      { deedNumber: new RegExp(`^${deedNumber}$`, "i") },
      { propertyId: new RegExp(`^${deedNumber}$`, "i") },
    ],
  });

  if (!deed) {
    return res.status(404).json({ success: false, message: "Deed not found." });
  }

  try {
    const pdfBuffer = await generateDeedPdfBuffer(deed);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Bhoomi-Deed-${deed.deedNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation streaming error:", err);
    res.status(500).json({ success: false, message: "Failed to generate deed PDF document." });
  }
}

export async function listDeeds(req, res) {
  const filter = {};
  if (req.user && req.user.role === "citizen") {
    filter.ownerId = req.user.id;
  }

  const deeds = await Deed.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: deeds.length,
    data: deeds,
  });
}

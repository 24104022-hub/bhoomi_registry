import { Registration } from "../models/Registration.js";
import { ActionLog } from "../models/ActionLog.js";
import { Notification } from "../models/Notification.js";
import { sendOfficialActionEmail } from "../services/emailService.js";

export async function getSurveyorQueue(req, res) {
  const registrations = await Registration.find({
    status: { $in: ["pending", "surveyorReview", "surveyVerified"] },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
}

export async function verifyBoundary(req, res) {
  const { id } = req.params;
  const { boundaryVerified, remarks, surveyNo } = req.body;

  const registration = await Registration.findOne({ id });
  if (!registration) {
    return res.status(404).json({ success: false, message: "Registration not found." });
  }

  const surveyorName = req.user?.fullName || "Licensed Surveyor";
  const prevStatus = registration.status;
  const nextStatus = boundaryVerified ? "surveyVerified" : "pending";

  registration.status = nextStatus;
  registration.surveyDetails = {
    boundaryVerified: Boolean(boundaryVerified),
    remarks: remarks || (boundaryVerified ? "Cadastral boundaries verified & pegged." : "Boundary dispute or discrepancy noted."),
    surveyorName,
    verifiedAt: new Date(),
  };

  registration.timeline.push({
    stage: "Surveyor Boundary Verification",
    status: boundaryVerified ? "verified" : "flagged",
    performedBy: surveyorName,
    role: "surveyor",
    remarks: remarks || (boundaryVerified ? "Cadastral field survey completed and boundary sealed." : "Discrepancy observed."),
    date: new Date(),
  });

  await registration.save();

  const actionType = boundaryVerified ? "SURVEY_COMPLETED" : "SURVEY_FLAGGED";

  // Record ActionLog
  await ActionLog.create({
    entityType: "registration",
    entityId: id,
    action: actionType,
    performedBy: surveyorName,
    role: "surveyor",
    previousStatus: prevStatus,
    newStatus: nextStatus,
    remarks: remarks || "",
    emailSentTo: registration.applicantEmail,
  });

  // Create official notification and dispatch email via Nodemailer SMTP
  if (registration.applicantEmail) {
    await sendOfficialActionEmail({
      toEmail: registration.applicantEmail,
      recipientName: registration.applicantName,
      userId: registration.applicantId,
      actionType,
      propertyTitle: registration.propertyTitle,
      referenceId: registration.id,
      actorName: surveyorName,
      actorRole: "Licensed Surveyor",
      remarks: remarks || (boundaryVerified ? "Cadastral field boundaries verified & pegged." : "Boundary dispute or discrepancy noted."),
      link: `/track?ref=${id}`,
    });
  } else {
    await Notification.create({
      id: `N-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: registration.applicantId,
      title: boundaryVerified ? "Boundary Survey Verified" : "Survey Action Required",
      body: `Surveyor ${surveyorName} has completed the boundary inspection for ${registration.propertyTitle}. Remarks: ${remarks || "None"}`,
      date: new Date().toISOString().slice(0, 10),
      link: `/track?ref=${id}`,
      type: "survey",
    });
  }

  res.json({
    success: true,
    message: "Surveyor boundary inspection recorded and citizen notified.",
    data: registration,
  });
}

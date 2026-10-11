import { Appointment } from "../models/Appointment.js";
import { Notification } from "../models/Notification.js";
import { sendOfficialActionEmail } from "../services/emailService.js";

export async function getAppointments(req, res) {
  const appointments = await Appointment.find().sort({ dateTime: 1 });
  res.json({ success: true, count: appointments.length, data: appointments });
}

export async function createAppointment(req, res) {
  const { purpose, relatedTo, citizenName, citizenEmail, assignedTo, role, dateTime } = req.body;
  const newId = `APT-${Math.floor(3000 + Math.random() * 7000)}`;

  const appt = await Appointment.create({
    id: newId,
    purpose: purpose || "Document verification",
    relatedTo: relatedTo || "REG-2026-0001",
    citizenName: citizenName || (req.user ? req.user.fullName : "Citizen"),
    userId: req.user ? req.user.id : "",
    assignedTo: assignedTo || "Deputy Registrar S. Anand",
    role: role || "officer",
    dateTime: dateTime || new Date().toISOString(),
    status: "scheduled",
  });

  const emailRecipient = citizenEmail || (req.user ? req.user.email : "");
  if (emailRecipient) {
    await sendOfficialActionEmail({
      toEmail: emailRecipient,
      recipientName: citizenName || (req.user ? req.user.fullName : "Citizen"),
      userId: req.user ? req.user.id : "",
      actionType: "APPOINTMENT_SCHEDULED",
      referenceId: newId,
      actorName: assignedTo || "Deputy Registrar S. Anand",
      actorRole: role || "officer",
      remarks: `Official hearing scheduled for '${appt.purpose}'.`,
      appointmentDetails: {
        dateTime: new Date(appt.dateTime).toLocaleString(),
        venue: "Sub-Registrar Office, Bhoomi Land Registry",
      },
    });
  } else if (req.user) {
    await Notification.create({
      id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: req.user.id,
      title: "Appointment Scheduled",
      body: `Your appointment for '${appt.purpose}' is set for ${new Date(appt.dateTime).toLocaleString()}.`,
      date: new Date().toISOString().slice(0, 10),
      type: "appointment",
    });
  }

  res.status(201).json({ success: true, data: appt });
}

export async function updateAppointment(req, res) {
  const { id } = req.params;
  const appt = await Appointment.findOneAndUpdate({ id }, req.body, { new: true });

  if (!appt) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }

  const emailRecipient = req.body.citizenEmail || (req.user ? req.user.email : "");
  if (emailRecipient) {
    await sendOfficialActionEmail({
      toEmail: emailRecipient,
      recipientName: appt.citizenName,
      userId: appt.userId || (req.user ? req.user.id : ""),
      actionType: "APPOINTMENT_UPDATED",
      referenceId: appt.id,
      actorName: appt.assignedTo || "Deputy Registrar",
      actorRole: "officer",
      remarks: `Appointment status updated to ${appt.status} for '${appt.purpose}'.`,
      appointmentDetails: {
        dateTime: new Date(appt.dateTime).toLocaleString(),
        venue: "Sub-Registrar Office, Bhoomi Land Registry",
      },
    });
  }

  res.json({ success: true, data: appt });
}

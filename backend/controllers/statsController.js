import { Property } from "../models/Property.js";
import { Registration } from "../models/Registration.js";
import { PropertyTransfer } from "../models/PropertyTransfer.js";
import { Payment } from "../models/Payment.js";
import { Appointment } from "../models/Appointment.js";
import { Document } from "../models/Document.js";
import { User } from "../models/User.js";
import { Deed } from "../models/Deed.js";
import { ActionLog } from "../models/ActionLog.js";

export async function getDashboardStats(req, res) {
  try {
    const [
      propertiesCount,
      registrationsCount,
      pendingRegistrationsCount,
      transfersCount,
      paymentsCount,
      duePaymentsCount,
      appointmentsCount,
      documentsCount,
      pendingDocumentsCount,
      usersCount,
      deedsCount,
      recentActions,
    ] = await Promise.all([
      Property.countDocuments(),
      Registration.countDocuments(),
      Registration.countDocuments({ status: { $in: ["pending", "underReview", "surveyorReview"] } }),
      PropertyTransfer.countDocuments(),
      Payment.countDocuments(),
      Payment.countDocuments({ status: "due" }),
      Appointment.countDocuments({ status: "scheduled" }),
      Document.countDocuments(),
      Document.countDocuments({ status: "pending" }),
      User.countDocuments(),
      Deed.countDocuments(),
      ActionLog.find().sort({ timestamp: -1 }).limit(6),
    ]);

    res.json({
      success: true,
      data: {
        properties: propertiesCount,
        registrations: registrationsCount,
        pendingRegistrations: pendingRegistrationsCount,
        transfers: transfersCount,
        payments: paymentsCount,
        duePayments: duePaymentsCount,
        appointments: appointmentsCount,
        documents: documentsCount,
        pendingDocuments: pendingDocumentsCount,
        users: usersCount,
        deeds: deedsCount,
        recentActions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

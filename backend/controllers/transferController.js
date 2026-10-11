import { PropertyTransfer } from "../models/PropertyTransfer.js";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import { ActionLog } from "../models/ActionLog.js";
import { sendOfficialActionEmail } from "../services/emailService.js";
import { generateUniqueUserId } from "../utils/idGenerator.js";

/**
 * Retrieves property transfers list.
 * Citizens only see transfers they are involved in (as seller or buyer).
 * Officials (Registrar, Admin, Surveyor, Lawyer) can view all or filter by status.
 */
export async function getTransfers(req, res) {
  const { status, propertyId } = req.query;
  const filter = {};

  if (status && status !== "all") {
    filter.status = status;
  }

  if (propertyId) {
    filter.propertyId = propertyId;
  }

  if (req.user && req.user.role === "citizen") {
    filter.$or = [
      { fromOwnerId: req.user.id },
      { fromOwnerEmail: req.user.email },
      { toOwnerId: req.user.id },
      { toEmail: req.user.email },
      { fromOwner: req.user.fullName },
    ];
  }

  const transfers = await PropertyTransfer.find(filter).sort({ createdAt: -1 });
  res.json({
    success: true,
    count: transfers.length,
    data: transfers,
    transfers,
  });
}

/**
 * Retrieves a single transfer by reference ID with authorization check.
 */
export async function getTransferById(req, res) {
  const { id } = req.params;
  const transfer = await PropertyTransfer.findOne({ id });

  if (!transfer) {
    return res.status(404).json({ success: false, message: "Transfer record not found." });
  }

  if (req.user && req.user.role === "citizen") {
    const isParty =
      transfer.fromOwnerId === req.user.id ||
      transfer.fromOwnerEmail === req.user.email ||
      transfer.toOwnerId === req.user.id ||
      transfer.toEmail === req.user.email;
    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have authorization to view this property transfer record.",
      });
    }
  }

  res.json({ success: true, data: transfer });
}

/**
 * Initiates a new property transfer.
 * Strictly verifies that the authenticated user owns the property.
 * Prevents self-transfers and duplicate active transfers.
 */
export async function createTransfer(req, res) {
  const { propertyId, toOwner, toEmail, transferType, remarks } = req.body;

  if (!propertyId || !toOwner || !toEmail) {
    return res.status(400).json({
      success: false,
      message: "Property ID, buyer full name, and buyer email address are required.",
    });
  }

  const cleanToEmail = String(toEmail).trim().toLowerCase();
  const cleanToOwner = String(toOwner).trim();

  // Find target property in MongoDB
  const property = await Property.findOne({ id: propertyId });
  if (!property) {
    return res.status(404).json({ success: false, message: "Property not found." });
  }

  // Enforce ownership: only the authenticated legal owner can transfer their property
  if (req.user && req.user.role === "citizen" && property.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You can only initiate transfers for properties that you legally own.",
    });
  }

  // Prevent transferring property to oneself
  if (req.user && req.user.email && req.user.email.toLowerCase() === cleanToEmail) {
    return res.status(400).json({
      success: false,
      message: "Invalid transfer: The recipient buyer cannot be the current property owner.",
    });
  }

  // Prevent duplicate active transfers on the same property
  const activeTransfer = await PropertyTransfer.findOne({
    propertyId: property.id,
    status: { $in: ["pending", "underReview"] },
  });
  if (activeTransfer) {
    return res.status(400).json({
      success: false,
      message: `An active transfer request (${activeTransfer.id}) is already pending Sub-Registrar review for this property.`,
    });
  }

  // Look up buyer user account if already registered
  const buyerUser = await User.findOne({ email: cleanToEmail });

  const newId = `TR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const sellerName = property.ownerName || (req.user ? req.user.fullName : "Property Owner");
  const sellerEmail = property.ownerEmail || (req.user ? req.user.email : "");
  const sellerId = property.ownerId || (req.user ? req.user.id : "");

  const transfer = await PropertyTransfer.create({
    id: newId,
    propertyId: property.id,
    propertyTitle: property.title,
    fromOwnerId: sellerId,
    fromOwner: sellerName,
    fromOwnerEmail: sellerEmail,
    toOwnerId: buyerUser ? buyerUser.id : "",
    toOwner: cleanToOwner,
    toEmail: cleanToEmail,
    transferType: transferType || "Sale",
    status: "underReview",
    deedNumber: property.deedNumber || "",
    estValue: property.estValue || 0,
    remarks: remarks || "",
    initiatedOn: new Date().toISOString().slice(0, 10),
  });

  // Record official action log
  await ActionLog.create({
    entityType: "transfer",
    entityId: newId,
    action: "TRANSFER_REQUESTED",
    performedBy: sellerName,
    role: "citizen",
    previousStatus: "none",
    newStatus: "underReview",
    remarks: `Transfer initiated (${transferType || "Sale"}) to ${cleanToOwner} (${cleanToEmail})`,
    emailSentTo: `${cleanToEmail}, ${sellerEmail}`,
  });

  // Notify Buyer
  await sendOfficialActionEmail({
    toEmail: cleanToEmail,
    recipientName: cleanToOwner,
    userId: buyerUser ? buyerUser.id : "CITIZEN_BUYER",
    actionType: "TRANSFER_REQUESTED",
    propertyTitle: property.title,
    referenceId: newId,
    actorName: sellerName,
    actorRole: "Property Owner",
    remarks: `Ownership transfer initiated via ${transferType || "Sale"}. Awaiting Sub-Registrar adjudication.`,
  });

  // Notify Seller
  if (sellerEmail) {
    await sendOfficialActionEmail({
      toEmail: sellerEmail,
      recipientName: sellerName,
      userId: sellerId,
      actionType: "TRANSFER_REQUESTED",
      propertyTitle: property.title,
      referenceId: newId,
      actorName: sellerName,
      actorRole: "Property Owner",
      remarks: `Your transfer application for '${property.title}' to ${cleanToOwner} has been submitted for Sub-Registrar review.`,
    });
  }

  res.status(201).json({ success: true, data: transfer, transfer });
}

/**
 * Adjudicates a property transfer (Approve or Reject).
 * Strictly restricted to authorized Sub-Registrars and Administrators.
 * On approval: reassigns Property.ownerId, ownerName, ownerEmail in database,
 * moving property from Seller's list to Buyer's list.
 * On rejection: leaves ownership unchanged.
 * Notifies BOTH parties via real email only after successful execution.
 */
export async function updateTransfer(req, res) {
  const { id } = req.params;
  const { status, remarks } = req.body;

  // Authorization check: Only authorized registrars or admins can adjudicate
  if (!req.user || !["officer", "registrar", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "Forbidden: Only authorized Sub-Registrars or Administrators can approve or reject property transfers.",
    });
  }

  const transfer = await PropertyTransfer.findOne({ id });
  if (!transfer) {
    return res.status(404).json({ success: false, message: "Transfer record not found." });
  }

  if (["approved", "rejected"].includes(transfer.status)) {
    return res.status(400).json({
      success: false,
      message: `Transfer ${id} has already been adjudicated with status '${transfer.status}'.`,
    });
  }

  const prevStatus = transfer.status;
  const registrarName = req.user.fullName || "Sub-Registrar Officer";
  const targetStatus = status === "approved" ? "approved" : "rejected";

  transfer.status = targetStatus;
  transfer.remarks =
    remarks ||
    (targetStatus === "approved"
      ? "Ownership conveyance verified, stamp duty reconciled, and title legally transferred."
      : "Transfer application rejected by Sub-Registrar.");

  if (targetStatus === "approved") {
    transfer.completedOn = new Date().toISOString().slice(0, 10);
    transfer.approvedBy = registrarName;
    transfer.approvedAt = new Date();
  }

  // Find associated property
  const property = await Property.findOne({ id: transfer.propertyId });
  if (!property) {
    return res.status(404).json({ success: false, message: "Associated property record not found." });
  }

  let buyerUser = null;
  if (targetStatus === "approved") {
    // 1. Look up or dynamically provision the buyer's citizen user account
    const cleanToEmail = transfer.toEmail.trim().toLowerCase();
    buyerUser = await User.findOne({ email: cleanToEmail });

    if (!buyerUser) {
      const newUserId = await generateUniqueUserId("citizen");
      buyerUser = await User.create({
        id: newUserId,
        fullName: transfer.toOwner,
        email: cleanToEmail,
        role: "citizen",
        isActive: true,
      });
      console.log(`[Transfer] Dynamically provisioned new citizen account for buyer ${cleanToEmail} (ID: ${newUserId})`);
    }

    transfer.toOwnerId = buyerUser.id;

    // 2. CRITICAL DATABASE UPDATE: Reassign property ownership to the new buyer!
    const previousOwnerId = property.ownerId;
    const previousOwnerName = property.ownerName;

    property.ownerId = buyerUser.id;
    property.ownerName = buyerUser.fullName || transfer.toOwner;
    property.ownerEmail = buyerUser.email || transfer.toEmail;

    property.timeline.push({
      stage: `Ownership Conveyance Approved (${transfer.transferType || "Sale"})`,
      status: "approved",
      performedBy: registrarName,
      role: "officer",
      remarks:
        remarks ||
        `Ownership legally transferred from ${previousOwnerName} (${previousOwnerId}) to ${property.ownerName} (${buyerUser.id}).`,
      date: new Date(),
    });

    await property.save();
    console.log(`[Transfer Success] Property ${property.id} ownership reassigned from ${previousOwnerId} to ${buyerUser.id}`);
  }

  await transfer.save();

  // Record ActionLog
  await ActionLog.create({
    entityType: "transfer",
    entityId: id,
    action: targetStatus === "approved" ? "TRANSFER_APPROVED" : "TRANSFER_REJECTED",
    performedBy: registrarName,
    role: "officer",
    previousStatus: prevStatus,
    newStatus: targetStatus,
    remarks: remarks || "",
    emailSentTo: `${transfer.toEmail}, ${transfer.fromOwnerEmail}`,
  });

  // Notify BOTH parties by email only after the action succeeds!
  if (targetStatus === "approved") {
    // 1. Notify Buyer
    await sendOfficialActionEmail({
      toEmail: transfer.toEmail,
      recipientName: transfer.toOwner,
      userId: buyerUser ? buyerUser.id : (transfer.toOwnerId || "BUYER"),
      actionType: "TRANSFER_APPROVED",
      propertyTitle: transfer.propertyTitle,
      referenceId: id,
      actorName: registrarName,
      actorRole: "Sub-Registrar",
      remarks:
        remarks ||
        `Sub-Registrar ${registrarName} has approved the ownership conveyance for '${transfer.propertyTitle}'. The property title is now registered in your name.`,
    });

    // 2. Notify Seller
    if (transfer.fromOwnerEmail) {
      await sendOfficialActionEmail({
        toEmail: transfer.fromOwnerEmail,
        recipientName: transfer.fromOwner,
        userId: transfer.fromOwnerId || "SELLER",
        actionType: "TRANSFER_APPROVED",
        propertyTitle: transfer.propertyTitle,
        referenceId: id,
        actorName: registrarName,
        actorRole: "Sub-Registrar",
        remarks:
          remarks ||
          `Sub-Registrar ${registrarName} has executed the conveyance deed for '${transfer.propertyTitle}'. Ownership has been legally transferred to ${transfer.toOwner}.`,
      });
    }
  } else {
    // Rejection notification to Seller
    if (transfer.fromOwnerEmail) {
      await sendOfficialActionEmail({
        toEmail: transfer.fromOwnerEmail,
        recipientName: transfer.fromOwner,
        userId: transfer.fromOwnerId || "SELLER",
        actionType: "TRANSFER_REJECTED",
        propertyTitle: transfer.propertyTitle,
        referenceId: id,
        actorName: registrarName,
        actorRole: "Sub-Registrar",
        remarks:
          remarks ||
          `Transfer application for '${transfer.propertyTitle}' was rejected by Sub-Registrar. Ownership remains with you.`,
      });
    }

    // Rejection notification to Buyer
    await sendOfficialActionEmail({
      toEmail: transfer.toEmail,
      recipientName: transfer.toOwner,
      userId: transfer.toOwnerId || "BUYER",
      actionType: "TRANSFER_REJECTED",
      propertyTitle: transfer.propertyTitle,
      referenceId: id,
      actorName: registrarName,
      actorRole: "Sub-Registrar",
      remarks: remarks || `Transfer application for '${transfer.propertyTitle}' was rejected by Sub-Registrar.`,
    });
  }

  res.json({
    success: true,
    message:
      targetStatus === "approved"
        ? `Property transfer successfully approved! Ownership updated to ${transfer.toOwner}.`
        : `Property transfer rejected. Title remains with ${transfer.fromOwner}.`,
    data: {
      transfer,
      property,
    },
    transfer,
    property,
  });
}

/**
 * Dedicated endpoint for Sub-Registrar to approve transfer.
 */
export async function approveTransfer(req, res) {
  req.body.status = "approved";
  return updateTransfer(req, res);
}

/**
 * Dedicated endpoint for Sub-Registrar to reject transfer.
 */
export async function rejectTransfer(req, res) {
  req.body.status = "rejected";
  return updateTransfer(req, res);
}

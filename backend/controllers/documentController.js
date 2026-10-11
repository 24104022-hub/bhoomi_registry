import { Document } from "../models/Document.js";
import { Notification } from "../models/Notification.js";

export async function getDocuments(req, res) {
  const { status, relatedTo } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (relatedTo) filter.relatedTo = relatedTo;

  const docs = await Document.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: docs.length, data: docs });
}

export async function createDocument(req, res) {
  const { name, relatedTo, category } = req.body;
  const newId = `DOC-${Math.floor(7000 + Math.random() * 3000)}`;

  const doc = await Document.create({
    id: newId,
    name: name || "document.pdf",
    relatedTo: relatedTo || "PR-9001",
    category: category || "Deed",
    status: "pending",
    uploadedOn: new Date().toISOString().slice(0, 10),
    uploadedBy: req.user ? req.user.fullName : req.body.uploadedBy || "Karthik Raman",
    userId: req.user ? req.user.id : req.body.userId || "U-1001",
  });

  res.status(201).json({ success: true, data: doc });
}

export async function updateDocument(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const doc = await Document.findOneAndUpdate(
    { id },
    { status, verifiedBy: req.user ? req.user.fullName : "Verified Official" },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({ success: false, message: "Document not found." });
  }

  if (doc.userId) {
    await Notification.create({
      id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: doc.userId,
      title: `Document ${status}`,
      body: `Your document '${doc.name}' (${doc.category}) has been marked as ${status}.`,
      date: new Date().toISOString().slice(0, 10),
      type: "system",
    });
  }

  res.json({ success: true, data: doc });
}

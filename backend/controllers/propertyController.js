import { Property } from "../models/Property.js";

export async function getProperties(req, res) {
  try {
    const { search, type, ownerId } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { deedNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    // Strict Data Isolation:
    // If the requester is a Citizen, strictly restrict to their authenticated JWT user ID.
    // Citizens cannot inspect, query, or spoof another citizen's ownerId.
    if (req.user && req.user.role === "citizen") {
      filter.ownerId = req.user.id;
    } else if (ownerId) {
      // Official roles (admin, officer, registrar, surveyor, lawyer) can query specific ownerId or view all
      filter.ownerId = ownerId;
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: properties.length,
      data: properties,
      properties,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getPropertyById(req, res) {
  try {
    const { id } = req.params;
    const property = await Property.findOne({ id });

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found." });
    }

    // Authorization check: Citizens are strictly forbidden from viewing another citizen's property records
    if (req.user && req.user.role === "citizen" && property.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You do not have authorization to view another citizen's property records.",
      });
    }

    // Track in recently viewed
    if (req.user) {
      const existingIndex = property.recentlyViewedBy.findIndex((item) => item.userId === req.user.id);
      if (existingIndex > -1) {
        property.recentlyViewedBy[existingIndex].viewedAt = new Date();
      } else {
        property.recentlyViewedBy.unshift({ userId: req.user.id, viewedAt: new Date() });
        if (property.recentlyViewedBy.length > 20) {
          property.recentlyViewedBy.pop();
        }
      }
      await property.save();
    }

    res.json({
      success: true,
      data: property,
      property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRecentlyViewed(req, res) {
  try {
    if (!req.user) {
      return res.json({ success: true, data: [] });
    }

    const filter = { "recentlyViewedBy.userId": req.user.id };
    // Citizens should only see their own properties in recently viewed
    if (req.user.role === "citizen") {
      filter.ownerId = req.user.id;
    }

    const properties = await Property.find(filter)
      .sort({ "recentlyViewedBy.viewedAt": -1 })
      .limit(8);

    res.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createProperty(req, res) {
  try {
    const data = req.body;
    const newId = `PROP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const property = await Property.create({
      id: newId,
      ...data,
      ownerId: req.user ? req.user.id : data.ownerId,
      ownerName: req.user ? req.user.fullName : (data.ownerName || "Property Owner"),
      ownerEmail: req.user ? req.user.email : data.ownerEmail,
      timeline: [
        {
          stage: "Property Record Created",
          status: "active",
          performedBy: req.user ? req.user.fullName : "System",
          role: req.user ? req.user.role : "admin",
          remarks: "Cadastral property parcel record created",
          date: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: property,
      property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProperty(req, res) {
  const { id } = req.params;
  const property = await Property.findOne({ id });

  if (!property) {
    return res.status(404).json({ success: false, message: "Property not found." });
  }

  // Citizens cannot modify other citizens' properties
  if (req.user && req.user.role === "citizen" && property.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: You cannot modify another citizen's property.",
    });
  }

  Object.assign(property, req.body);
  await property.save();

  res.json({
    success: true,
    data: property,
  });
}

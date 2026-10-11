import { LandParcel } from "../models/LandParcel.js";

export async function getLandParcels(req, res) {
  const { search } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { surveyNo: { $regex: search, $options: "i" } },
      { village: { $regex: search, $options: "i" } },
      { district: { $regex: search, $options: "i" } },
    ];
  }

  const parcels = await LandParcel.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: parcels.length, data: parcels });
}

export async function createLandParcel(req, res) {
  const newId = `LP-${Math.floor(3000 + Math.random() * 7000)}`;
  const parcel = await LandParcel.create({
    id: newId,
    ...req.body,
  });
  res.status(201).json({ success: true, data: parcel });
}

export async function updateLandParcel(req, res) {
  const { id } = req.params;
  const parcel = await LandParcel.findOneAndUpdate({ id }, req.body, { new: true });
  if (!parcel) {
    return res.status(404).json({ success: false, message: "Land parcel not found." });
  }
  res.json({ success: true, data: parcel });
}

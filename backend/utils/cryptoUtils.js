import crypto from "crypto";
import { generateUniqueDeedNumber } from "./idGenerator.js";

/**
 * Computes an immutable SHA-256 cryptographic digital signature fingerprint
 * over all core legal title deed attributes.
 */
export function generateDeedHash(deedData) {
  const boundaries = deedData.boundaries || {};
  const boundaryStr = `${boundaries.north || ""}|${boundaries.south || ""}|${boundaries.east || ""}|${boundaries.west || ""}`;

  const payload = [
    deedData.deedNumber,
    deedData.propertyId,
    deedData.registrationId || "",
    deedData.ownerId || "",
    deedData.ownerName,
    deedData.areaSqft,
    deedData.surveyNumber || "",
    boundaryStr,
    deedData.address,
    deedData.coordinates?.lat,
    deedData.coordinates?.lng,
    deedData.issueDate ? new Date(deedData.issueDate).toISOString() : new Date().toISOString(),
    deedData.registrarName,
    deedData.registrarOffice || "",
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex");
}

export { generateUniqueDeedNumber as generateDeedNumber };

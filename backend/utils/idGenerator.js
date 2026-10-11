import crypto from "crypto";
import { User } from "../models/User.js";
import { Registration } from "../models/Registration.js";
import { Property } from "../models/Property.js";
import { Deed } from "../models/Deed.js";

/**
 * Generates a unique, collision-checked Owner / User ID.
 * Example: U-2026-84912
 */
export async function generateUniqueUserId(role = "citizen") {
  const year = new Date().getFullYear();
  while (true) {
    const suffix = crypto.randomInt(10000, 99999);
    const candidate = `U-${year}-${suffix}`;
    const exists = await User.exists({ id: candidate });
    if (!exists) return candidate;
  }
}

/**
 * Generates a unique, collision-checked Application / Registration ID.
 * Example: REG-2026-78321
 */
export async function generateUniqueRegistrationId() {
  const year = new Date().getFullYear();
  while (true) {
    const suffix = crypto.randomInt(10000, 99999);
    const candidate = `REG-${year}-${suffix}`;
    const exists = await Registration.exists({ id: candidate });
    if (!exists) return candidate;
  }
}

/**
 * Generates a unique, collision-checked Cadastral Property ID.
 * Example: PROP-2026-91823
 */
export async function generateUniquePropertyId() {
  const year = new Date().getFullYear();
  while (true) {
    const suffix = crypto.randomInt(10000, 99999);
    const candidate = `PROP-${year}-${suffix}`;
    const exists = await Property.exists({ id: candidate });
    if (!exists) return candidate;
  }
}

/**
 * Generates a unique, collision-checked State Land Title Deed Number.
 * Example: DEED-2026-482910
 */
export async function generateUniqueDeedNumber() {
  const year = new Date().getFullYear();
  while (true) {
    const suffix = crypto.randomInt(100000, 999999);
    const candidate = `DEED-${year}-${suffix}`;
    const exists = await Deed.exists({ deedNumber: candidate });
    if (!exists) return candidate;
  }
}

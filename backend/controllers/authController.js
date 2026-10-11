import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { generateUniqueUserId } from "../utils/idGenerator.js";

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function normalizeRole(rawRole) {
  if (!rawRole) return null;
  const clean = String(rawRole).trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (["officer", "registrationofficer", "registrar", "subregistrar"].includes(clean)) {
    return "officer";
  }
  if (["citizen", "user"].includes(clean)) {
    return "citizen";
  }
  if (["surveyor", "landsurveyor"].includes(clean)) {
    return "surveyor";
  }
  if (["lawyer", "advocate", "attorney"].includes(clean)) {
    return "lawyer";
  }
  if (["admin", "administrator"].includes(clean)) {
    return "admin";
  }
  return clean;
}

function generateToken(user) {
  const secret = process.env.JWT_SECRET || "bhoomi_super_secret_jwt_key_2026_land_registry_secure";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user.id,
      _id: user._id?.toString(),
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn,
    }
  );
}

export const ALLOWED_SELF_ROLES = ["citizen", "surveyor", "lawyer"];

export function createGoogleRegToken(payload) {
  const secret = process.env.JWT_SECRET || "bhoomi_super_secret_jwt_key_2026_land_registry_secure";
  return jwt.sign(
    {
      purpose: "google_registration",
      email: payload.email,
      googleId: payload.googleId,
      fullName: payload.fullName,
      avatar: payload.avatar || "",
    },
    secret,
    { expiresIn: "1h" }
  );
}

// ---------------------------------------------------------------------
// Standard Email/Password Authentication (with bcrypt)
// ---------------------------------------------------------------------
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide both email and password." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Incorrect email or password.",
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "This account has been deactivated. Please contact an administrator.",
    });
  }

  if (!user.password) {
    return res.status(401).json({
      success: false,
      message: "This account was registered using Google Sign-In. Please sign in with Google.",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Incorrect email or password.",
    });
  }

  // Generate signed JWT with user's verified role saved in database
  const token = generateToken(user);

  res.json({
    success: true,
    token,
    user: user.toSafeJSON(),
  });
}

export async function register(req, res) {
  const { fullName, email, password, phone, aadhaar } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: "Full name, email, and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    if (!existing.password) {
      // Account was pre-created during property transfer; allow citizen to set password and activate!
      existing.fullName = String(fullName).trim();
      existing.password = password;
      if (phone) existing.phone = phone;
      if (aadhaar) existing.aadhaar = aadhaar;
      existing.isActive = true;
      await existing.save();

      const token = generateToken(existing);
      return res.status(200).json({
        success: true,
        message: "Account successfully activated.",
        token,
        user: existing.toSafeJSON(),
      });
    }
    return res.status(400).json({ success: false, message: "USER_EXISTS" });
  }

  const newId = await generateUniqueUserId("citizen");
  // Public self-registration is strictly restricted to citizen role
  const assignedRole = "citizen";

  const user = await User.create({
    id: newId,
    fullName: String(fullName).trim(),
    email: cleanEmail,
    password,
    phone: phone || "",
    aadhaar: aadhaar || "",
    role: assignedRole,
  });

  // Create welcome notification
  await Notification.create({
    id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    userId: user.id,
    title: "Welcome to Bhoomi Registry",
    body: "Your citizen account has been successfully created.",
    date: new Date().toISOString().slice(0, 10),
    type: "system",
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeJSON(),
  });
}

// ---------------------------------------------------------------------
// Google OAuth 2.0 Backend Implementation
// ---------------------------------------------------------------------

/**
 * Returns the Google OAuth 2.0 authorization URL.
 * Configured only via .env (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL).
 */
export async function getGoogleAuthUrl(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;
  const { redirect = "/app/dashboard" } = req.query;

  const statePayload = {
    redirect,
    timestamp: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64");

  if (!clientId || !clientId.trim()) {
    return res.status(500).json({
      success: false,
      message: "GOOGLE_CLIENT_ID is not configured in backend/.env.",
    });
  }

  try {
    const client = getOAuthClient();
    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "consent",
      state,
      redirect_uri: callbackUrl,
    });

    return res.json({
      success: true,
      url: authUrl,
      configured: true,
      callbackUrl,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to generate Google auth URL: ${err.message}`,
    });
  }
}

/**
 * Handles Google OAuth 2.0 Callback:
 * /api/auth/google/callback?code=...&state=...
 * Exchanges code with Google, verifies identity, fetches saved role from database,
 * issues signed JWT, and redirects to frontend.
 */
export async function handleGoogleCallback(req, res) {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (error) {
    console.error("[OAuth] Google authorization error:", error);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Missing authorization code from Google.")}`);
  }

  let redirectPath = "/app/dashboard";
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      if (parsed.redirect) redirectPath = parsed.redirect;
    } catch (err) {
      console.warn("[OAuth] Could not parse state parameter:", err.message);
    }
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Google OAuth secrets are not configured in backend/.env.")}`);
  }

  let googleEmail = "";
  let googleName = "";
  let googleId = "";
  let picture = "";

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken({
      code,
      redirect_uri: callbackUrl,
    });
    client.setCredentials(tokens);

    if (tokens.id_token) {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      googleEmail = payload.email;
      googleName = payload.name;
      googleId = payload.sub;
      picture = payload.picture || "";
    } else if (tokens.access_token) {
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const payload = await userinfoRes.json();
      googleEmail = payload.email;
      googleName = payload.name;
      googleId = payload.sub;
      picture = payload.picture || "";
    }
  } catch (err) {
    console.error("[OAuth] Token exchange error with Google:", err.message);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Google verification failed: " + err.message)}`);
  }

  if (!googleEmail) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Unable to retrieve verified email from Google.")}`);
  }

  try {
    const cleanEmail = googleEmail.toLowerCase().trim();
    // Look up existing user by verified Google email or googleId
    let user = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(googleId ? [{ googleId }] : [])
      ]
    });

    if (!user) {
      // NEW GOOGLE USER:
      // Do NOT auto-assign hardcoded role. Generate a signed googleRegToken and redirect
      // to the registration form so the user can select an allowed role (Citizen, Surveyor, Lawyer).
      const googleRegToken = createGoogleRegToken({
        email: cleanEmail,
        googleId,
        fullName: googleName || cleanEmail.split("@")[0],
        avatar: picture || "",
      });

      const targetUrl = new URL("/register", frontendUrl);
      targetUrl.searchParams.set("googleRegToken", googleRegToken);
      targetUrl.searchParams.set("email", cleanEmail);
      targetUrl.searchParams.set("name", googleName || cleanEmail.split("@")[0]);
      if (googleId) targetUrl.searchParams.set("googleId", googleId);
      if (picture) targetUrl.searchParams.set("avatar", picture);
      if (redirectPath) targetUrl.searchParams.set("redirect", redirectPath);

      return res.redirect(targetUrl.toString());
    }

    // EXISTING USER:
    if (!user.isActive) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Your account has been deactivated. Please contact an administrator.")}`);
    }

    let modified = false;
    // Link Google ID if not yet linked
    if (!user.googleId && googleId) {
      user.googleId = googleId;
      modified = true;
    }
    if (picture && !user.avatar) {
      user.avatar = picture;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
    // CRITICAL: user.role is PRESERVED exactly as saved in MongoDB!

    // Generate signed JWT with user's verified role saved in database
    const token = generateToken(user);

    // Redirect to frontend auth callback with token and role
    const targetUrl = new URL("/auth/callback", frontendUrl);
    targetUrl.searchParams.set("token", token);
    targetUrl.searchParams.set("role", user.role);
    targetUrl.searchParams.set("name", user.fullName);
    if (redirectPath) targetUrl.searchParams.set("redirect", redirectPath);

    return res.redirect(targetUrl.toString());
  } catch (dbErr) {
    console.error("[OAuth] Database error during Google login:", dbErr);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Database error saving Google user.")}`);
  }
}

/**
 * Direct Google Authorization Code Exchange (POST /api/auth/google/exchange)
 */
export async function exchangeGoogleCode(req, res) {
  const { code, redirect_uri } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: "Authorization code is required." });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = redirect_uri || process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ success: false, message: "Google OAuth credentials not configured in backend/.env." });
  }

  let googleEmail = "";
  let googleName = "";
  let googleId = "";
  let picture = "";

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken({ code, redirect_uri: callbackUrl });
    client.setCredentials(tokens);

    if (tokens.id_token) {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      googleEmail = payload.email;
      googleName = payload.name;
      googleId = payload.sub;
      picture = payload.picture || "";
    } else if (tokens.access_token) {
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const payload = await userinfoRes.json();
      googleEmail = payload.email;
      googleName = payload.name;
      googleId = payload.sub;
      picture = payload.picture || "";
    }
  } catch (err) {
    return res.status(400).json({ success: false, message: `Google code exchange failed: ${err.message}` });
  }

  if (!googleEmail) {
    return res.status(400).json({ success: false, message: "Unable to retrieve verified email from Google." });
  }

  const cleanEmail = googleEmail.toLowerCase().trim();
  let user = await User.findOne({
    $or: [
      { email: cleanEmail },
      ...(googleId ? [{ googleId }] : [])
    ]
  });

  if (!user) {
    const googleRegToken = createGoogleRegToken({
      email: cleanEmail,
      googleId,
      fullName: googleName || cleanEmail.split("@")[0],
      avatar: picture || "",
    });

    return res.json({
      success: true,
      isNewUser: true,
      googleRegToken,
      profile: {
        email: cleanEmail,
        googleId,
        fullName: googleName || cleanEmail.split("@")[0],
        avatar: picture || "",
      },
    });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "Account has been deactivated." });
  }

  let mod = false;
  if (!user.googleId && googleId) { user.googleId = googleId; mod = true; }
  if (picture && !user.avatar) { user.avatar = picture; mod = true; }
  if (mod) await user.save();

  const token = generateToken(user);
  return res.json({
    success: true,
    isNewUser: false,
    token,
    user: user.toSafeJSON(),
  });
}

/**
 * Complete Google User Registration with Selected Role (POST /api/auth/google/register)
 * Allows Citizen, Surveyor, or Lawyer. Restricts Registrar and Admin.
 */
export async function completeGoogleRegistration(req, res) {
  const { googleRegToken, fullName, role, phone, aadhaar, license, barId } = req.body;

  if (!googleRegToken) {
    return res.status(400).json({ success: false, message: "Google registration token is required." });
  }

  const secret = process.env.JWT_SECRET || "bhoomi_super_secret_jwt_key_2026_land_registry_secure";
  let decoded;
  try {
    decoded = jwt.verify(googleRegToken, secret);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Google verification session has expired or is invalid. Please sign in with Google again.",
    });
  }

  if (decoded.purpose !== "google_registration" || !decoded.email) {
    return res.status(400).json({ success: false, message: "Invalid Google registration session." });
  }

  const cleanEmail = decoded.email.toLowerCase().trim();
  const normalizedRole = normalizeRole(role) || "citizen";

  // Strict role check: Citizen, Surveyor, or Lawyer only
  if (!ALLOWED_SELF_ROLES.includes(normalizedRole)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden role. Public self-registration is strictly restricted to Citizen, Surveyor, or Lawyer. Registrar and Administrator roles require authorized administrative assignment.",
    });
  }

  try {
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (!user.googleId && decoded.googleId) user.googleId = decoded.googleId;
      if (!user.avatar && decoded.avatar) user.avatar = decoded.avatar;
      await user.save();
    } else {
      const newId = await generateUniqueUserId(normalizedRole);
      user = await User.create({
        id: newId,
        fullName: String(fullName || decoded.fullName || cleanEmail.split("@")[0]).trim(),
        email: cleanEmail,
        role: normalizedRole,
        googleId: decoded.googleId || null,
        avatar: decoded.avatar || "",
        phone: phone ? String(phone).trim() : "",
        aadhaar: aadhaar ? String(aadhaar).trim() : "",
        license: normalizedRole === "surveyor" ? (license ? String(license).trim() : "") : "",
        barId: normalizedRole === "lawyer" ? (barId ? String(barId).trim() : "") : "",
        isActive: true,
      });

      await Notification.create({
        id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        userId: user.id,
        title: "Google Registration Completed",
        body: `Welcome to Bhoomi Registry! Your account has been registered with the ${normalizedRole.toUpperCase()} role.`,
        date: new Date().toISOString().slice(0, 10),
        type: "system",
      });
    }

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error("[OAuth] Error completing Google registration:", err);
    return res.status(500).json({
      success: false,
      message: `Failed to complete registration: ${err.message}`,
    });
  }
}

/**
 * Google Sign-In with client ID token credential (POST /api/auth/google)
 */
export async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: "Google ID token credential is required." });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ success: false, message: "Google Client ID not configured on server." });
  }

  let googleEmail = "";
  let googleName = "";
  let googleId = "";
  let picture = "";

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    googleEmail = payload.email;
    googleName = payload.name;
    googleId = payload.sub;
    picture = payload.picture || "";
  } catch (err) {
    return res.status(401).json({ success: false, message: `Google verification failed: ${err.message}` });
  }

  if (!googleEmail) {
    return res.status(400).json({ success: false, message: "Google authentication failed: Email not found." });
  }

  const cleanEmail = googleEmail.toLowerCase().trim();
  let user = await User.findOne({
    $or: [
      { email: cleanEmail },
      ...(googleId ? [{ googleId }] : [])
    ]
  });

  if (!user) {
    const reqRole = req.body.role ? normalizeRole(req.body.role) : null;
    if (reqRole && ALLOWED_SELF_ROLES.includes(reqRole)) {
      const newId = `U-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
      user = await User.create({
        id: newId,
        fullName: String(req.body.fullName || googleName || cleanEmail.split("@")[0]).trim(),
        email: cleanEmail,
        role: reqRole,
        googleId,
        avatar: picture || "",
        phone: req.body.phone || "",
        aadhaar: req.body.aadhaar || "",
        license: reqRole === "surveyor" ? (req.body.license || "") : "",
        barId: reqRole === "lawyer" ? (req.body.barId || "") : "",
        isActive: true,
      });

      await Notification.create({
        id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        userId: user.id,
        title: "Google Registration Completed",
        body: `Welcome to Bhoomi Registry! Your account has been registered with the ${reqRole.toUpperCase()} role.`,
        date: new Date().toISOString().slice(0, 10),
        type: "system",
      });
    } else {
      // Prompt client to select allowed role (Citizen, Surveyor, Lawyer)
      const googleRegToken = createGoogleRegToken({
        email: cleanEmail,
        googleId,
        fullName: googleName || cleanEmail.split("@")[0],
        avatar: picture || "",
      });

      return res.json({
        success: true,
        isNewUser: true,
        googleRegToken,
        profile: {
          email: cleanEmail,
          googleId,
          fullName: googleName || cleanEmail.split("@")[0],
          avatar: picture || "",
        },
      });
    }
  } else {
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account has been deactivated." });
    }
    let mod = false;
    if (!user.googleId && googleId) { user.googleId = googleId; mod = true; }
    if (picture && !user.avatar) { user.avatar = picture; mod = true; }
    if (mod) await user.save();
  }

  const token = generateToken(user);

  res.json({
    success: true,
    isNewUser: false,
    token,
    user: user.toSafeJSON(),
  });
}

export async function getMe(req, res) {
  res.json({
    success: true,
    user: req.user.toSafeJSON(),
  });
}

export async function updateProfile(req, res) {
  const { fullName, phone, aadhaar, office, license, barId } = req.body;
  const user = req.user;

  if (fullName) user.fullName = String(fullName).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (aadhaar !== undefined) user.aadhaar = String(aadhaar).trim();
  if (office !== undefined && (user.role === "officer" || user.role === "admin")) user.office = office;
  if (license !== undefined && (user.role === "surveyor" || user.role === "admin")) user.license = license;
  if (barId !== undefined && (user.role === "lawyer" || user.role === "admin")) user.barId = barId;

  // Crucial: role is intentionally never updated through user profile modification
  await user.save();

  await Notification.create({
    id: `N-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    userId: user.id,
    title: "Profile updated",
    body: "Your profile information has been updated successfully.",
    date: new Date().toISOString().slice(0, 10),
    type: "system",
  });

  res.json({
    success: true,
    user: user.toSafeJSON(),
  });
}

export async function logout(req, res) {
  res.json({
    success: true,
    message: "Logged out successfully.",
  });
}

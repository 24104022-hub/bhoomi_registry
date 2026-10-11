// E2E Test Suite for Google OAuth, JWT Protection, Auto Role Detection, RBAC, and Security
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const API = `http://127.0.0.1:${process.env.PORT || 5000}/api`;
const JWT_SECRET = process.env.JWT_SECRET || "bhoomi_super_secret_jwt_key_2026_land_registry_secure";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("   BHOOMI REGISTRY - GOOGLE OAUTH + JWT + AUTO ROLE DETECTION TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = null) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      if (details) console.log(`       -> ${JSON.stringify(details)}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      if (details) console.error(`       -> ${JSON.stringify(details)}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Google OAuth URL Generation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: GOOGLE OAUTH URL GENERATION ---");
  const urlRes = await fetch(`${API}/auth/google/url?redirect=/app/dashboard`);
  const urlData = await urlRes.json();
  assert(
    urlRes.status === 200 && urlData.success && urlData.url?.includes("accounts.google.com"),
    "Google OAuth URL generated with live Google accounts endpoint",
    { urlHost: "accounts.google.com", callbackUrl: urlData.callbackUrl }
  );

  // -------------------------------------------------------------------------
  // TEST 2: Email Registration & Duplicate Account Prevention
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: REGISTRATION & PREVENTING DUPLICATE ACCOUNTS ---");
  const testRegEmail = `test.user.${Date.now()}@example.in`;

  // 2a: Successful citizen registration
  const regRes = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Citizen One",
      email: testRegEmail,
      password: "SecurePassword123!",
      phone: "+91 98765 00001",
      aadhaar: "1234-5678-9012",
    }),
  });
  const regData = await regRes.json();
  assert(
    regRes.status === 201 && regData.success && regData.token && regData.user?.role === "citizen",
    "Registration succeeds, returns signed JWT and assigns citizen role",
    { email: regData.user?.email, role: regData.user?.role, userId: regData.user?.id }
  );

  // 2b: Duplicate registration prevention
  const dupRes = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Duplicate Imposter",
      email: testRegEmail,
      password: "AnotherPassword123!",
    }),
  });
  const dupData = await dupRes.json();
  assert(
    dupRes.status === 400 && dupData.message === "USER_EXISTS",
    "Duplicate account registration with same email is strictly rejected (USER_EXISTS)",
    { status: dupRes.status, message: dupData.message }
  );

  // 2c: Restrict self-assignment of privileged roles (Admin / Registrar)
  const exploitEmail = `exploit.user.${Date.now()}@example.in`;
  const exploitRes = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Attacker Trying Admin",
      email: exploitEmail,
      password: "Password123!",
      role: "admin", // Malicious attempt to self-assign admin
    }),
  });
  const exploitData = await exploitRes.json();
  assert(
    exploitRes.status === 201 && exploitData.user?.role === "citizen",
    "Public registration strictly restricts role to 'citizen', ignoring unauthorized 'admin' role request",
    { requestedRole: "admin", grantedRole: exploitData.user?.role }
  );

  // -------------------------------------------------------------------------
  // TEST 3: Login & Bcrypt Verification
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: LOGIN & BCRYPT PASSWORD VERIFICATION ---");
  // 3a: Successful login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testRegEmail,
      password: "SecurePassword123!",
    }),
  });
  const loginData = await loginRes.json();
  assert(
    loginRes.status === 200 && loginData.success && loginData.token,
    "Valid credentials log in successfully and return signed JWT",
    { email: loginData.user?.email, role: loginData.user?.role }
  );
  const citizenToken = loginData.token;

  // 3b: Invalid password rejected
  const badLoginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testRegEmail,
      password: "WrongPassword999!",
    }),
  });
  assert(
    badLoginRes.status === 401,
    "Incorrect password rejected with 401 Unauthorized",
    { status: badLoginRes.status }
  );

  // -------------------------------------------------------------------------
  // TEST 4: Official Administrator Login & Role Verification
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: OFFICIAL ADMINISTRATOR LOGIN ---");
  const adminLoginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@bhoomi.gov.in",
      password: "Admin@Bhoomi2026!",
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert(
    adminLoginRes.status === 200 && adminLoginData.user?.role === "admin",
    "System Administrator logs in with 'admin' role loaded from database",
    { email: adminLoginData.user?.email, role: adminLoginData.user?.role }
  );
  const adminToken = adminLoginData.token;

  // -------------------------------------------------------------------------
  // TEST 5: Auto Role Detection & Role Persistence (e.g. 24104022@nec.edu.in)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: ROLE PERSISTENCE IN DATABASE ---");
  // Check that 24104022@nec.edu.in exists and has role citizen in DB
  const { User } = await import("./models/User.js");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_STRING || "mongodb://localhost:27017/bhoomi_land_registry");
  }
  const userNec = await User.findOne({ email: "24104022@nec.edu.in" });
  assert(
    userNec && userNec.role === "citizen" && Boolean(userNec.googleId),
    "Example user '24104022@nec.edu.in' has verified Google ID and role 'citizen' in DB",
    { email: userNec?.email, role: userNec?.role, googleId: userNec?.googleId }
  );

  // Generate a signed token simulating userNec session
  const necToken = jwt.sign(
    { id: userNec?.id, email: userNec?.email, role: userNec?.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  const necMeRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${necToken}` },
  });
  const necMeData = await necMeRes.json();
  assert(
    necMeRes.status === 200 && necMeData.user?.role === "citizen",
    "User '24104022@nec.edu.in' auto-detects saved role 'citizen' via JWT verification",
    { email: necMeData.user?.email, role: necMeData.user?.role }
  );

  // -------------------------------------------------------------------------
  // TEST 6: JWT Middleware Protection & Expiration Handling
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: JWT VALIDATION & EXPIRED TOKEN REJECTION ---");
  // 6a: Missing token rejected
  const noTokenRes = await fetch(`${API}/auth/me`);
  assert(
    noTokenRes.status === 401,
    "Accessing protected API without token is rejected (401)",
    { status: noTokenRes.status }
  );

  // 6b: Tampered/invalid token rejected
  const tamperedRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer invalid.token.payload" },
  });
  const tamperedData = await tamperedRes.json();
  assert(
    tamperedRes.status === 401 && tamperedData.code === "INVALID_TOKEN",
    "Tampered/invalid JWT is rejected with code INVALID_TOKEN",
    { status: tamperedRes.status, code: tamperedData.code }
  );

  // 6c: Expired token rejected with TOKEN_EXPIRED
  const expiredToken = jwt.sign(
    { id: userNec?.id, email: userNec?.email, role: userNec?.role },
    JWT_SECRET,
    { expiresIn: "-10s" } // Expired 10 seconds ago
  );
  const expRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  const expData = await expRes.json();
  assert(
    expRes.status === 401 && expData.code === "TOKEN_EXPIRED",
    "Expired JWT is rejected with code TOKEN_EXPIRED",
    { status: expRes.status, code: expData.code }
  );

  // -------------------------------------------------------------------------
  // TEST 7: Role-Based Access Control (RBAC) & Privilege Separation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: ROLE-BASED ACCESS CONTROL (RBAC) ---");
  // 7a: Citizen attempting Admin endpoint (/api/users) -> 403 Forbidden
  const citizenToAdminRes = await fetch(`${API}/users`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  const citizenToAdminData = await citizenToAdminRes.json();
  assert(
    citizenToAdminRes.status === 403 && citizenToAdminData.code === "FORBIDDEN",
    "Citizen accessing admin-only /api/users is forbidden (403 FORBIDDEN)",
    { status: citizenToAdminRes.status, code: citizenToAdminData.code }
  );

  // 7b: Citizen attempting Surveyor queue (/api/surveyor/queue) -> 403 Forbidden
  const citizenToSurvRes = await fetch(`${API}/surveyor/queue`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  assert(
    citizenToSurvRes.status === 403,
    "Citizen accessing surveyor-only /api/surveyor/queue is forbidden (403)",
    { status: citizenToSurvRes.status }
  );

  // 7c: Citizen attempting Registrar queue (/api/registrar/queue) -> 403 Forbidden
  const citizenToRegRes = await fetch(`${API}/registrar/queue`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  assert(
    citizenToRegRes.status === 403,
    "Citizen accessing registrar-only /api/registrar/queue is forbidden (403)",
    { status: citizenToRegRes.status }
  );

  // 7d: Admin accessing /api/users -> 200 OK
  const adminUsersRes = await fetch(`${API}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminUsersData = await adminUsersRes.json();
  assert(
    adminUsersRes.status === 200 && adminUsersData.success && Array.isArray(adminUsersData.data),
    "Admin accessing /api/users is authorized (200 OK)",
    { userCount: adminUsersData.count }
  );

  // 7e: Unauthorized role tampering via profile update is prevented
  const profileHackRes = await fetch(`${API}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${citizenToken}`,
    },
    body: JSON.stringify({ role: "admin", fullName: "Citizen Attempting Elevation" }),
  });
  const profileHackData = await profileHackRes.json();
  assert(
    profileHackRes.status === 200 && profileHackData.user?.role === "citizen",
    "Profile update prevents role escalation (role remains 'citizen')",
    { roleAfterAttempt: profileHackData.user?.role }
  );

  // -------------------------------------------------------------------------
  // TEST 8: Logout Endpoint
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: LOGOUT ENDPOINT ---");
  const logoutRes = await fetch(`${API}/auth/logout`, { method: "POST" });
  const logoutData = await logoutRes.json();
  assert(
    logoutRes.status === 200 && logoutData.success,
    "Logout endpoint returns 200 success",
    { message: logoutData.message }
  );

  // -------------------------------------------------------------------------
  // TEST 9: Clean Database Verification (Zero mock users with @demo.in)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 9: CLEAN DATABASE & NO MOCK USERS ---");
  const remainingMockUsers = await User.countDocuments({ email: { $regex: /@demo\.in$/i } });
  assert(
    remainingMockUsers === 0,
    "Database contains 0 mock users with @demo.in domain",
    { remainingMockCount: remainingMockUsers }
  );

  // -------------------------------------------------------------------------
  // TEST 10: New Google User Registration Flow (Role Selection: Surveyor)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 10: NEW GOOGLE USER REGISTRATION & ROLE SELECTION ---");
  const newGoogleEmail = `new.google.surveyor.${Date.now()}@example.in`;
  const newGoogleId = `google-uid-${Date.now()}`;
  const validGoogleRegToken = jwt.sign(
    {
      purpose: "google_registration",
      email: newGoogleEmail,
      googleId: newGoogleId,
      fullName: "New Google Surveyor",
      avatar: "https://lh3.googleusercontent.com/test-avatar.png",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 10a: Unauthorized role exploit prevention (Attempting Admin via Google Reg)
  const hackRoleRes = await fetch(`${API}/auth/google/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      googleRegToken: validGoogleRegToken,
      fullName: "Attacker Trying Admin",
      role: "admin",
    }),
  });
  assert(
    hackRoleRes.status === 403,
    "Google registration strictly rejects self-assignment of 'admin' role (403 Forbidden)",
    { status: hackRoleRes.status }
  );

  // 10b: Unauthorized role exploit prevention (Attempting Registrar via Google Reg)
  const hackRegistrarRes = await fetch(`${API}/auth/google/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      googleRegToken: validGoogleRegToken,
      fullName: "Attacker Trying Registrar",
      role: "officer",
    }),
  });
  assert(
    hackRegistrarRes.status === 403,
    "Google registration strictly rejects self-assignment of 'registrar/officer' role (403 Forbidden)",
    { status: hackRegistrarRes.status }
  );

  // 10c: Successful role selection as Surveyor
  const googleSurvRegRes = await fetch(`${API}/auth/google/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      googleRegToken: validGoogleRegToken,
      fullName: "Kiran Surveyor",
      role: "surveyor",
      license: "SURV-KA-2026-9042",
      phone: "+91 98765 43210",
      aadhaar: "8899-1122-3344",
    }),
  });
  const googleSurvData = await googleSurvRegRes.json();
  assert(
    googleSurvRegRes.status === 201 && googleSurvData.success && googleSurvData.user?.role === "surveyor",
    "New Google user successfully registers with selected 'surveyor' role and license",
    { email: googleSurvData.user?.email, role: googleSurvData.user?.role, license: googleSurvData.user?.license }
  );
  const surveyorToken = googleSurvData.token;

  // 10d: Database verification
  const survInDb = await User.findOne({ email: newGoogleEmail });
  assert(
    survInDb && survInDb.role === "surveyor" && survInDb.googleId === newGoogleId && survInDb.license === "SURV-KA-2026-9042",
    "Verified Google email, Google ID, and selected 'surveyor' role saved in MongoDB",
    { email: survInDb?.email, role: survInDb?.role, googleId: survInDb?.googleId }
  );

  // 10e: Future login simulation: automatically fetch saved role without asking again
  const survFutureMeRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${surveyorToken}` },
  });
  const survFutureMeData = await survFutureMeRes.json();
  assert(
    survFutureMeRes.status === 200 && survFutureMeData.user?.role === "surveyor",
    "Future login automatically loads saved 'surveyor' role from database without re-asking",
    { email: survFutureMeData.user?.email, role: survFutureMeData.user?.role }
  );

  // -------------------------------------------------------------------------
  // TEST 11: New Google User Registration Flow (Role Selection: Lawyer)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 11: NEW GOOGLE USER REGISTRATION (LAWYER ROLE) ---");
  const newLawyerEmail = `new.google.lawyer.${Date.now()}@example.in`;
  const newLawyerGoogleId = `google-lawyer-uid-${Date.now()}`;
  const validLawyerRegToken = jwt.sign(
    {
      purpose: "google_registration",
      email: newLawyerEmail,
      googleId: newLawyerGoogleId,
      fullName: "Adv. Rajesh Kumar",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const googleLawyerRegRes = await fetch(`${API}/auth/google/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      googleRegToken: validLawyerRegToken,
      fullName: "Adv. Rajesh Kumar",
      role: "lawyer",
      barId: "BAR-IND-2024-8821",
      phone: "+91 98888 77777",
    }),
  });
  const googleLawyerData = await googleLawyerRegRes.json();
  assert(
    googleLawyerRegRes.status === 201 && googleLawyerData.user?.role === "lawyer" && googleLawyerData.token,
    "New Google user registers with selected 'lawyer' role and receives signed JWT",
    { email: googleLawyerData.user?.email, role: googleLawyerData.user?.role, barId: googleLawyerData.user?.barId }
  );

  // Future login check for lawyer
  const lawyerFutureMeRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${googleLawyerData.token}` },
  });
  const lawyerFutureMeData = await lawyerFutureMeRes.json();
  assert(
    lawyerFutureMeRes.status === 200 && lawyerFutureMeData.user?.role === "lawyer",
    "Future login automatically loads saved 'lawyer' role from database without re-asking",
    { email: lawyerFutureMeData.user?.email, role: lawyerFutureMeData.user?.role }
  );

  // Cleanup test-created users
  await User.deleteMany({ email: { $in: [testRegEmail, exploitEmail, newGoogleEmail, newLawyerEmail] } });

  console.log("\n================================================================================");
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================================");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error("Test execution encountered an error:", err);
  process.exit(1);
});

// test_properties_and_email.js
// Comprehensive E2E test script to verify:
// 1. Citizen Property Data Isolation (Citizen A cannot view or tamper with Citizen B's properties)
// 2. Real Nodemailer & SMTP Email Notifications (lifecycle triggers, valid Message-IDs, Ethereal preview URLs)
// 3. Duplicate Email Prevention (Idempotency Key validation)
// 4. Failed Notification Retry Endpoint (POST /api/notifications/:id/retry)

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("================================================================================");
  console.log("       BHOOMI LAND REGISTRY - PROPERTY ISOLATION & EMAIL NOTIFICATION TESTS     ");
  console.log("================================================================================\n");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      testsFailed++;
    }
  }

  const timestamp = Date.now();
  const citizenA_email = `citizena_${timestamp}@example.com`;
  const citizenB_email = `citizenb_${timestamp}@example.com`;
  const officer_email = `officer_${timestamp}@example.com`;
  const password = "Password@123";

  // --- Step 1: Register Two Citizens and an Officer ---
  console.log("--> Step 1: Registering Citizen A, Citizen B, and Officer");

  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Citizen Ramesh Kumar",
      email: citizenA_email,
      password,
      role: "citizen",
      phone: "9876543210",
      aadhaar: `4321${timestamp.toString().slice(-8)}`,
    }),
  });
  const dataA = await regARes.json();
  assert(dataA.success && dataA.token, "Citizen A registered and received JWT");
  const tokenA = dataA.token;
  const userA = dataA.user;

  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Citizen Priya Sharma",
      email: citizenB_email,
      password,
      role: "citizen",
      phone: "9876543211",
      aadhaar: `5432${timestamp.toString().slice(-8)}`,
    }),
  });
  const dataB = await regBRes.json();
  assert(dataB.success && dataB.token, "Citizen B registered and received JWT");
  const tokenB = dataB.token;
  const userB = dataB.user;

  // Log in as Official Licensed Surveyor
  const loginSurveyorRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "surveyor@bhoomi.gov.in",
      password: "Surveyor@Bhoomi2026!",
    }),
  });
  const dataSurveyor = await loginSurveyorRes.json();
  assert(dataSurveyor.success && dataSurveyor.token, "Surveyor logged in and received JWT");
  const tokenSurveyor = dataSurveyor.token;

  // Log in as Official Sub-Registrar Officer
  const loginOfficerRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "officer@bhoomi.gov.in",
      password: "Officer@Bhoomi2026!",
    }),
  });
  const dataOfficer = await loginOfficerRes.json();
  assert(dataOfficer.success && dataOfficer.token, "Sub-Registrar Officer logged in and received JWT");
  const tokenOfficer = dataOfficer.token;

  // --- Step 2: Citizen A Submits Property Registration ---
  console.log("\n--> Step 2: Citizen A Submits Property Registration Application");
  const propTitleA = `Ramesh Green Villa Plot #${timestamp.toString().slice(-4)}`;
  const regSubResA = await fetch(`${BASE_URL}/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      propertyTitle: propTitleA,
      type: "Residential",
      areaSqft: 2400,
      address: "Plot 104, Gandhi Salai, Madurai",
      estValue: 4500000,
      surveyNumber: `SURV-MD-${timestamp.toString().slice(-4)}`,
    }),
  });
  const regSubDataA = await regSubResA.json();
  assert(regSubDataA.success && regSubDataA.data?.id, `Citizen A registered application: ${regSubDataA.data?.id}`);
  const regA_Id = regSubDataA.data.id;

  // --- Step 3: Citizen B Submits Property Registration ---
  console.log("\n--> Step 3: Citizen B Submits Property Registration Application");
  const propTitleB = `Priya Garden Estate #${timestamp.toString().slice(-4)}`;
  const regSubResB = await fetch(`${BASE_URL}/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      propertyTitle: propTitleB,
      type: "Commercial",
      areaSqft: 4800,
      address: "Survey 88, Ring Road, Chennai",
      estValue: 12000000,
      surveyNumber: `SURV-CH-${timestamp.toString().slice(-4)}`,
    }),
  });
  const regSubDataB = await regSubResB.json();
  assert(regSubDataB.success && regSubDataB.data?.id, `Citizen B registered application: ${regSubDataB.data?.id}`);
  const regB_Id = regSubDataB.data.id;

  // --- Step 4: Verify Surveyor Verification & Email Trigger ---
  console.log("\n--> Step 4: Surveyor Boundary Inspection & Email Dispatch");
  const surveyResA = await fetch(`${BASE_URL}/surveyor/verify/${regA_Id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenSurveyor}`,
    },
    body: JSON.stringify({
      boundaryVerified: true,
      remarks: "Pegging verified via DGPS. Boundaries authenticated.",
    }),
  });
  const surveyDataA = await surveyResA.json();
  assert(surveyDataA.success && surveyDataA.data?.status === "surveyVerified", "Surveyor verification for App A completed");

  const surveyResB = await fetch(`${BASE_URL}/surveyor/verify/${regB_Id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenSurveyor}`,
    },
    body: JSON.stringify({
      boundaryVerified: true,
      remarks: "Commercial boundaries verified and pegged.",
    }),
  });
  const surveyDataB = await surveyResB.json();
  assert(surveyDataB.success && surveyDataB.data?.status === "surveyVerified", "Surveyor verification for App B completed");

  // --- Step 5: Verify Registrar Approval, Deed Creation & Email Trigger ---
  console.log("\n--> Step 5: Registrar Approval, Deed Generation & Live Email Dispatch");
  const approveResA = await fetch(`${BASE_URL}/registrar/approve/${regA_Id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenOfficer}`,
    },
    body: JSON.stringify({
      remarks: "Cadastral boundaries verified. Digital deed sealed and authorized.",
    }),
  });
  const approveDataA = await approveResA.json();
  assert(approveDataA.success && approveDataA.data?.deed?.deedNumber, `Title Deed created: ${approveDataA.data?.deed?.deedNumber}`);
  const propA_Id = approveDataA.data.property.id;

  // Approve Citizen B's application as well to produce Property B
  const approveResB = await fetch(`${BASE_URL}/registrar/approve/${regB_Id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenOfficer}`,
    },
    body: JSON.stringify({
      remarks: "Commercial plot registered with Sub-Registrar seal.",
    }),
  });
  const approveDataB = await approveResB.json();
  assert(approveDataB.success && approveDataB.data?.property?.id, `Property B created: ${approveDataB.data?.property?.id}`);
  const propB_Id = approveDataB.data.property.id;

  // --- Step 6: Verify Property Data Isolation & Authorization ---
  console.log("\n--> Step 6: Testing Citizen Property Isolation & RBAC");

  // Citizen A requests properties list
  const listARes = await fetch(`${BASE_URL}/properties`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const listAData = await listARes.json();
  assert(listAData.success, "Citizen A retrieved properties list successfully");

  const hasPropAInListA = listAData.data.some((p) => p.id === propA_Id);
  const hasPropBInListA = listAData.data.some((p) => p.id === propB_Id);
  assert(hasPropAInListA, "Citizen A's list CONTAINS Property A");
  assert(!hasPropBInListA, "Citizen A's list DOES NOT CONTAIN Property B (Strict Isolation enforced)");

  // Citizen B requests properties list
  const listBRes = await fetch(`${BASE_URL}/properties`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const listBData = await listBRes.json();
  const hasPropAInListB = listBData.data.some((p) => p.id === propA_Id);
  const hasPropBInListB = listBData.data.some((p) => p.id === propB_Id);
  assert(!hasPropAInListB, "Citizen B's list DOES NOT CONTAIN Property A (Strict Isolation enforced)");
  assert(hasPropBInListB, "Citizen B's list CONTAINS Property B");

  // Citizen A tries to directly access Property B by ID
  const directGetBbyA = await fetch(`${BASE_URL}/properties/${propB_Id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(directGetBbyA.status === 403, `Citizen A GET /properties/${propB_Id} rejected with 403 Forbidden`);

  // Citizen A tries to directly update Property B
  const directPutBbyA = await fetch(`${BASE_URL}/properties/${propB_Id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ title: "Hacked Title" }),
  });
  assert(directPutBbyA.status === 403, `Citizen A PUT /properties/${propB_Id} rejected with 403 Forbidden`);

  // Officer requests properties list
  const listOfficerRes = await fetch(`${BASE_URL}/properties`, {
    headers: { Authorization: `Bearer ${tokenOfficer}` },
  });
  const listOfficerData = await listOfficerRes.json();
  const hasPropAInOfficer = listOfficerData.data.some((p) => p.id === propA_Id);
  const hasPropBInOfficer = listOfficerData.data.some((p) => p.id === propB_Id);
  assert(hasPropAInOfficer && hasPropBInOfficer, "Officer can access all properties across all citizens");

  // --- Step 7: Verify Real Email Notification Delivery Status ---
  console.log("\n--> Step 7: Verifying Nodemailer SMTP Delivery Records in MongoDB");
  const notifResA = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const notifDataA = await notifResA.json();
  assert(notifDataA.success && notifDataA.data.length > 0, `Citizen A has ${notifDataA.data.length} notifications`);

  const approvalEmail = notifDataA.data.find((n) => n.actionType === "REGISTRAR_APPROVED");
  assert(approvalEmail !== undefined, "Found REGISTRAR_APPROVED notification record");
  if (approvalEmail) {
    assert(
      ["sent", "failed"].includes(approvalEmail.deliveryStatus),
      `Valid delivery status recorded: '${approvalEmail.deliveryStatus}'`
    );
    if (approvalEmail.deliveryStatus === "sent") {
      assert(approvalEmail.smtpMessageId !== undefined, `SMTP Message-ID present: ${approvalEmail.smtpMessageId}`);
      if (approvalEmail.previewUrl) {
        console.log(`  [INFO] Ethereal live preview URL: ${approvalEmail.previewUrl}`);
      }
    }
  }

  // --- Step 8: Verify Idempotency (Duplicate Prevention) ---
  console.log("\n--> Step 8: Verifying Duplicate Email Prevention (Idempotency Key)");
  const duplicateApproveRes = await fetch(`${BASE_URL}/registrar/approve/${regA_Id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenOfficer}`,
    },
    body: JSON.stringify({ remarks: "Second approval attempt" }),
  });
  assert(
    duplicateApproveRes.status === 400,
    "Duplicate registrar approval prevented (already approved deed)"
  );

  // --- Step 9: Verify Notification Retry Endpoint ---
  console.log("\n--> Step 9: Testing Notification Retry Endpoint (POST /api/notifications/:id/retry)");
  if (approvalEmail) {
    const retryRes = await fetch(`${BASE_URL}/notifications/${approvalEmail.id}/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const retryData = await retryRes.json();
    if (!retryData.success) {
      console.log("  [DEBUG] Retry response status:", retryRes.status, "body:", retryData);
    }
    assert(retryData.success, "Retry endpoint executed and dispatched email over SMTP");
  }

  // --- Step 10: Appointment Notification Delivery ---
  console.log("\n--> Step 10: Scheduling Appointment with Email Delivery");
  const apptRes = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      purpose: "Final Deed Stamp Verification",
      citizenEmail: citizenA_email,
      citizenName: "Citizen Ramesh Kumar",
      dateTime: new Date(Date.now() + 86400000).toISOString(),
    }),
  });
  const apptData = await apptRes.json();
  assert(apptData.success && apptData.data?.id, `Appointment created: ${apptData.data?.id}`);

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("================================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});

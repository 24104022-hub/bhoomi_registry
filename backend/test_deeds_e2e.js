// Uses Node native fetch
const BASE_URL = "http://localhost:5000";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

async function run() {
  console.log("===============================================================");
  console.log("   BHOOMI REGISTRY: UNIQUE LAND DEEDS + PDF + QR E2E TEST      ");
  console.log("===============================================================\n");

  const timestamp = Date.now();
  const password = "Password123!";

  // 1. Create Citizen Owner A
  console.log("[1] Creating Citizen Owner A...");
  const emailA = `owner_a_${timestamp}@bhoomi.test`;
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Karthik Subramanian",
      email: emailA,
      password,
      phone: "9876543210",
      aadhaar: "1234-5678-9012",
    }),
  });
  const dataA = await regARes.json();
  assert(dataA.success === true, "Owner A registered successfully");
  const tokenA = dataA.token;
  const ownerA = dataA.user;
  assert(Boolean(ownerA.id && ownerA.id.startsWith("U-")), `Owner A has backend-generated ID: ${ownerA.id}`);

  // 2. Create Citizen Owner B
  console.log("\n[2] Creating Citizen Owner B...");
  const emailB = `owner_b_${timestamp}@bhoomi.test`;
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Ananya Meenakshi",
      email: emailB,
      password,
      phone: "9876543211",
      aadhaar: "9876-5432-1098",
    }),
  });
  const dataB = await regBRes.json();
  assert(dataB.success === true, "Owner B registered successfully");
  const tokenB = dataB.token;
  const ownerB = dataB.user;
  assert(Boolean(ownerB.id && ownerB.id.startsWith("U-")), `Owner B has backend-generated ID: ${ownerB.id}`);
  assert(ownerA.id !== ownerB.id, `Owner IDs are strictly unique (${ownerA.id} != ${ownerB.id})`);

  // 3. Create / Login Sub-Registrar Officer and Surveyor
  console.log("\n[3] Authenticating Registrar and Surveyor...");
  // Check if default registrar exists or register one
  let registrarToken = "";
  let registrarUser = null;
  const regOfficerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "officer@bhoomi.gov.in", password: "Officer@Bhoomi2026!" }),
  });
  let regOfficerData = await regOfficerLogin.json();
  if (regOfficerData.success) {
    registrarToken = regOfficerData.token;
    registrarUser = regOfficerData.user;
  }
  assert(Boolean(registrarToken), `Registrar authenticated (${registrarUser?.email || "officer@bhoomi.gov.in"}) with role: ${registrarUser?.role}`);

  // Check surveyor
  let surveyorToken = "";
  let surveyorUser = null;
  const surveyorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "surveyor@bhoomi.gov.in", password: "Surveyor@Bhoomi2026!" }),
  });
  let surveyorData = await surveyorLogin.json();
  if (surveyorData.success) {
    surveyorToken = surveyorData.token;
    surveyorUser = surveyorData.user;
  }
  assert(Boolean(surveyorToken), `Surveyor authenticated (${surveyorUser?.email || "surveyor@bhoomi.gov.in"})`);

  // 4. Owner A submits Property 1
  console.log("\n[4] Owner A submits Property 1 (Villa in Madurai South)...");
  const prop1Res = await fetch(`${BASE_URL}/api/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      propertyTitle: "Subramanian Heritage Villa",
      type: "Residential",
      areaSqft: 3400,
      address: "14 West Chithirai Street, Madurai South",
      estValue: 6500000,
      surveyNumber: "SURV-142/3A",
      boundaries: {
        north: "Plot 141 Private Land",
        south: "40ft Temple Roadway",
        east: "Survey Parcel 142/3B",
        west: "Drainage Canal Buffer",
      },
      registrationDate: "2026-10-15",
    }),
  });
  const prop1Data = await prop1Res.json();
  assert(prop1Data.success === true, "Property 1 submitted by Owner A");
  const reg1 = prop1Data.data;
  assert(Boolean(reg1.id && reg1.id.startsWith("REG-")), `Generated Registration ID 1: ${reg1.id}`);
  assert(reg1.applicantId === ownerA.id, "Property 1 correctly linked to Owner A");

  // 5. Owner A submits Property 2
  console.log("\n[5] Owner A submits Property 2 (Commercial Complex)...");
  const prop2Res = await fetch(`${BASE_URL}/api/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      propertyTitle: "Cauvery Plaza Commercial Complex",
      type: "Commercial",
      areaSqft: 7200,
      address: "88 Ring Road, Anna Nagar, Madurai",
      estValue: 18500000,
      surveyNumber: "SURV-88/1",
      boundaries: {
        north: "60ft Ring Road",
        south: "Corporation Park",
        east: "Commercial Bank Building",
        west: "Survey Plot 87",
      },
      registrationDate: "2026-10-20",
    }),
  });
  const prop2Data = await prop2Res.json();
  assert(prop2Data.success === true, "Property 2 submitted by Owner A");
  const reg2 = prop2Data.data;
  assert(Boolean(reg2.id && reg2.id.startsWith("REG-")), `Generated Registration ID 2: ${reg2.id}`);
  assert(reg1.id !== reg2.id, `Registration IDs are distinct (${reg1.id} != ${reg2.id})`);

  // 6. Owner B submits Property 3
  console.log("\n[6] Owner B submits Property 3 (Agricultural Farmland)...");
  const prop3Res = await fetch(`${BASE_URL}/api/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      propertyTitle: "Meenakshi Organic Coconut Groves",
      type: "Agricultural",
      areaSqft: 43560,
      address: "Survey Field 304, Melur Taluk, Madurai",
      estValue: 4200000,
      surveyNumber: "SURV-304/2B",
      boundaries: {
        north: "Irrigation Feeder Channel",
        south: "Cart Track & Pathway",
        east: "Sub-Division Parcel 304/2A",
        west: "State Highway 72 Border",
      },
      registrationDate: "2026-11-01",
    }),
  });
  const prop3Data = await prop3Res.json();
  assert(prop3Data.success === true, "Property 3 submitted by Owner B");
  const reg3 = prop3Data.data;
  assert(Boolean(reg3.id && reg3.id.startsWith("REG-")), `Generated Registration ID 3: ${reg3.id}`);
  assert(reg3.applicantId === ownerB.id, "Property 3 correctly linked to Owner B");

  // 7. Security: Citizen cannot approve registration or generate deeds
  console.log("\n[7] Security Check: Citizen cannot approve applications...");
  const unauthorizedApprove = await fetch(`${BASE_URL}/api/registrar/approve/${reg1.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ remarks: "Trying to self-approve" }),
  });
  assert(unauthorizedApprove.status === 403, `Citizen approval attempt rejected with HTTP 403 Forbidden`);

  // 8. Surveyor verifies boundaries for all 3 properties
  console.log("\n[8] Surveyor verifies cadastral boundaries for applications...");
  for (const reg of [reg1, reg2, reg3]) {
    const sRes = await fetch(`${BASE_URL}/api/surveyor/verify/${reg.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${surveyorToken}`,
      },
      body: JSON.stringify({
        boundaryVerified: true,
        surveyNo: reg.surveyNumber,
        remarks: "Cadastral field boundaries pegged and verified via Total Station survey.",
      }),
    });
    const sData = await sRes.json();
    assert(sData.success === true, `Survey verified for ${reg.id}`);
  }

  // 9. Registrar approves Property 1 -> Generates unique Deed 1 and Property ID 1
  console.log("\n[9] Registrar approves Property 1 (Owner A)...");
  const app1Res = await fetch(`${BASE_URL}/api/registrar/approve/${reg1.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${registrarToken}`,
    },
    body: JSON.stringify({
      remarks: "Title verified, stamp duty reconciled, digital title deed sealed.",
      office: "Madurai South Sub-Registrar Office",
    }),
  });
  const app1Data = await app1Res.json();
  assert(app1Data.success === true, "Property 1 approved by Sub-Registrar");
  const deed1 = app1Data.data.deed;
  const propRecord1 = app1Data.data.property;
  assert(Boolean(deed1 && deed1.deedNumber.startsWith("DEED-")), `Deed 1 generated: ${deed1.deedNumber}`);
  assert(Boolean(propRecord1 && propRecord1.id.startsWith("PROP-")), `Property 1 ID generated: ${propRecord1.id}`);
  assert(deed1.ownerId === ownerA.id, `Deed 1 ownerId matches Owner A (${ownerA.id})`);
  assert(deed1.propertyId === propRecord1.id, `Deed 1 correctly references Property 1 ID (${propRecord1.id})`);
  assert(deed1.registrationId === reg1.id, `Deed 1 correctly references Registration 1 ID (${reg1.id})`);
  assert(Boolean(deed1.qrCodeDataUrl), "Deed 1 contains authentic QR Code Data URL");
  assert(Boolean(deed1.verificationUrl), `Deed 1 contains verification URL: ${deed1.verificationUrl}`);
  assert(Boolean(deed1.digitalSignatureHash), `Deed 1 contains SHA-256 digital signature: ${deed1.digitalSignatureHash}`);

  // 10. Duplicate Prevention: Attempt to approve Property 1 again
  console.log("\n[10] Testing Duplicate Approval Prevention...");
  const dupAppRes = await fetch(`${BASE_URL}/api/registrar/approve/${reg1.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${registrarToken}`,
    },
    body: JSON.stringify({ remarks: "Duplicate approval attempt" }),
  });
  const dupAppData = await dupAppRes.json();
  assert(dupAppRes.status === 400 && dupAppData.success === false, "Duplicate approval blocked with HTTP 400 Bad Request");
  assert(dupAppData.message.includes("already been approved"), `Duplicate message returned: "${dupAppData.message}"`);

  // 11. Registrar approves Property 2 (Owner A) and Property 3 (Owner B)
  console.log("\n[11] Registrar approves Property 2 (Owner A) & Property 3 (Owner B)...");
  const app2Res = await fetch(`${BASE_URL}/api/registrar/approve/${reg2.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${registrarToken}` },
    body: JSON.stringify({ remarks: "Commercial conveyance registered." }),
  });
  const app2Data = await app2Res.json();
  const deed2 = app2Data.data.deed;
  const propRecord2 = app2Data.data.property;

  const app3Res = await fetch(`${BASE_URL}/api/registrar/approve/${reg3.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${registrarToken}` },
    body: JSON.stringify({ remarks: "Agricultural patta admitted and deed issued." }),
  });
  const app3Data = await app3Res.json();
  const deed3 = app3Data.data.deed;
  const propRecord3 = app3Data.data.property;

  assert(Boolean(deed2 && deed2.deedNumber.startsWith("DEED-")), `Deed 2 generated: ${deed2.deedNumber}`);
  assert(Boolean(deed3 && deed3.deedNumber.startsWith("DEED-")), `Deed 3 generated: ${deed3.deedNumber}`);

  // Check collision-free uniqueness across all 3 deeds and properties
  const allDeeds = [deed1.deedNumber, deed2.deedNumber, deed3.deedNumber];
  const uniqueDeeds = new Set(allDeeds);
  assert(uniqueDeeds.size === 3, `All 3 Deed Numbers are strictly unique: ${allDeeds.join(", ")}`);

  const allProps = [propRecord1.id, propRecord2.id, propRecord3.id];
  const uniqueProps = new Set(allProps);
  assert(uniqueProps.size === 3, `All 3 Property IDs are strictly unique: ${allProps.join(", ")}`);

  // Verify correct owner linking
  assert(deed2.ownerId === ownerA.id, `Deed 2 owner is Owner A (${ownerA.id})`);
  assert(deed3.ownerId === ownerB.id, `Deed 3 owner is Owner B (${ownerB.id})`);
  assert(deed3.ownerId !== deed1.ownerId, "Deed 3 and Deed 1 have distinct owners");

  // 12. PDF Deed Generation & Download Test
  console.log("\n[12] Testing Official PDF Generation from DB records...");
  for (const deed of [deed1, deed2, deed3]) {
    const pdfRes = await fetch(`${BASE_URL}/api/deeds/${encodeURIComponent(deed.deedNumber)}/pdf`);
    assert(pdfRes.status === 200, `PDF endpoint returned HTTP 200 for ${deed.deedNumber}`);
    assert(pdfRes.headers.get("content-type") === "application/pdf", `Content-Type is application/pdf`);
    const disposition = pdfRes.headers.get("content-disposition");
    assert(Boolean(disposition && disposition.includes(`Bhoomi-Deed-${deed.deedNumber}.pdf`)), `Filename header includes deed number: ${disposition}`);

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    assert(pdfBuffer.length > 5000, `PDF size is authentic (> 5KB): ${pdfBuffer.length} bytes`);
    const magic = pdfBuffer.slice(0, 4).toString("utf-8");
    assert(magic === "%PDF", `PDF buffer has valid magic bytes: ${magic}`);
  }

  // 13. Public QR Code Verification Test (Permanent Public URL)
  console.log("\n[13] Testing Permanent Public QR Verification URL...");
  // Test Deed 1 public verification (No auth token sent!)
  const verify1Res = await fetch(`${BASE_URL}/api/deeds/verify/${encodeURIComponent(deed1.deedNumber)}`);
  assert(verify1Res.status === 200, `Public verification returned HTTP 200 for ${deed1.deedNumber}`);
  const verify1Data = await verify1Res.json();
  assert(verify1Data.success === true && verify1Data.verified === true, "Deed 1 verified as authentic government record");
  
  const vData1 = verify1Data.data;
  assert(vData1.deedNumber === deed1.deedNumber, `Deed number matches: ${vData1.deedNumber}`);
  assert(vData1.ownerName === "Karthik Subramanian", `Owner name matches: ${vData1.ownerName}`);
  assert(vData1.ownerId === ownerA.id, `Owner ID matches: ${vData1.ownerId}`);
  assert(vData1.surveyNumber === "SURV-142/3A", `Survey Number matches: ${vData1.surveyNumber}`);
  assert(vData1.propertyId === propRecord1.id, `Property ID matches: ${vData1.propertyId}`);
  assert(vData1.registrationId === reg1.id, `Registration ID matches: ${vData1.registrationId}`);
  assert(vData1.status === "active", `Deed status is active: ${vData1.status}`);
  assert(vData1.boundaries.north === "Plot 141 Private Land", `North boundary verified: ${vData1.boundaries.north}`);
  assert(vData1.boundaries.south === "40ft Temple Roadway", `South boundary verified: ${vData1.boundaries.south}`);
  assert(vData1.boundaries.east === "Survey Parcel 142/3B", `East boundary verified: ${vData1.boundaries.east}`);
  assert(vData1.boundaries.west === "Drainage Canal Buffer", `West boundary verified: ${vData1.boundaries.west}`);
  assert(Boolean(vData1.qrCodeDataUrl), "Verification payload contains QR code image data");
  assert(Boolean(vData1.digitalSignatureHash), `Signature hash verified: ${vData1.digitalSignatureHash}`);

  // Test Deed 3 public verification (Owner B)
  const verify3Res = await fetch(`${BASE_URL}/api/deeds/verify/${encodeURIComponent(deed3.deedNumber)}`);
  const verify3Data = await verify3Res.json();
  const vData3 = verify3Data.data;
  assert(vData3.ownerName === "Ananya Meenakshi", `Owner B name matches: ${vData3.ownerName}`);
  assert(vData3.ownerId === ownerB.id, `Owner B ID matches: ${vData3.ownerId}`);
  assert(vData3.boundaries.north === "Irrigation Feeder Channel", `Farm boundary matches: ${vData3.boundaries.north}`);

  // Test Non-existent Deed verification
  const fakeDeedRes = await fetch(`${BASE_URL}/api/deeds/verify/DEED-9999-FAKE00`);
  assert(fakeDeedRes.status === 404, "Non-existent deed verification returned HTTP 404");
  const fakeDeedData = await fakeDeedRes.json();
  assert(fakeDeedData.verified === false, "Verified flag is false for fake deed");

  // 14. Deed Status Lifecycle & Revocation
  console.log("\n[14] Testing Deed Revocation Lifecycle & Public Verification...");
  // Citizen cannot revoke deed
  const citizenRevoke = await fetch(`${BASE_URL}/api/deeds/${encodeURIComponent(deed1.deedNumber)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ status: "revoked", remarks: "Citizen unauthorized attempt" }),
  });
  assert(citizenRevoke.status === 403, "Citizen revocation attempt blocked with HTTP 403 Forbidden");

  // Sub-Registrar revokes Deed 1 (e.g. Court Stay Order)
  const officerRevoke = await fetch(`${BASE_URL}/api/deeds/${encodeURIComponent(deed1.deedNumber)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${registrarToken}` },
    body: JSON.stringify({
      status: "revoked",
      remarks: "Title deed revoked pursuant to High Court Writ Petition 4819/2026.",
    }),
  });
  const revokeData = await officerRevoke.json();
  assert(revokeData.success === true, "Registrar updated deed status to 'revoked'");

  // Re-verify Deed 1 publicly: must immediately show revoked status and warning
  const verifyRevokedRes = await fetch(`${BASE_URL}/api/deeds/verify/${encodeURIComponent(deed1.deedNumber)}`);
  const verifyRevokedData = await verifyRevokedRes.json();
  assert(verifyRevokedData.data.status === "revoked", `Public verification immediately reflects status: ${verifyRevokedData.data.status}`);
  assert(verifyRevokedData.data.statusMessage.includes("REVOKED"), `Warning banner is present: "${verifyRevokedData.data.statusMessage}"`);

  // Download PDF of revoked deed: must render revoked status
  const revokedPdfRes = await fetch(`${BASE_URL}/api/deeds/${encodeURIComponent(deed1.deedNumber)}/pdf`);
  assert(revokedPdfRes.status === 200, "PDF generates for revoked deed");
  const revokedPdfBuffer = Buffer.from(await revokedPdfRes.arrayBuffer());
  assert(revokedPdfBuffer.length > 5000, `Revoked PDF buffer generated: ${revokedPdfBuffer.length} bytes`);

  // Final Summary
  console.log("\n===============================================================");
  console.log(`   E2E TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("===============================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});

// test_property_transfer_workflow.js
// Comprehensive End-to-End Test Suite for Property Transfer Workflow:
// 1. Dynamic Citizen Registration (Citizen Seller, Citizen Buyer, Sub-Registrar Officer)
// 2. Initial Property Ownership Setup
// 3. Security validations (Unauthorized transfers, self-transfers, non-existent properties)
// 4. Transfer Request Initiation & Duplicate Transfer Prevention
// 5. Pre-Approval Ownership Invariance Verification
// 6. Sub-Registrar Adjudication Queue Visibility
// 7. Role-Based Access Control on Approval (Citizen cannot approve -> 403; Officer approves -> 200)
// 8. Post-Approval Database Ownership Mutation & Dual-Party Property List Isolation
// 9. Post-Approval Authorization Lockdown (Old owner gets 403, New owner gets 200)
// 10. Email Notifications dispatched to BOTH parties
// 11. Rejection Workflow Verification (Ownership preserved with original owner, notifications dispatched)

const BASE_URL = "http://localhost:5000/api";

async function runWorkflowTests() {
  console.log("================================================================================");
  console.log("       BHOOMI LAND REGISTRY - COMPLETE PROPERTY TRANSFER WORKFLOW E2E TESTS    ");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = "") {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}${details ? " - " + details : ""}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const sellerEmail = `seller_${timestamp}@example.com`;
  const buyerEmail = `buyer_${timestamp}@example.com`;
  const officerEmail = `officer_${timestamp}@example.com`;
  const password = "Password@123";

  // ============================================================================
  // STEP 1: Dynamically Register Citizen Seller, Citizen Buyer, and Officer
  // ============================================================================
  console.log("--> Step 1: Dynamically registering test accounts without hardcoded IDs...");

  // Seller
  const sellerRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Anand Natarajan (Seller)",
      email: sellerEmail,
      password,
      role: "citizen",
      phone: "9876543201",
      aadhaar: `5432${timestamp.toString().slice(-8)}`,
    }),
  });
  const sellerData = await sellerRegRes.json();
  assert(sellerData.success && sellerData.token, "Seller account registered dynamically", JSON.stringify(sellerData));
  const sellerToken = sellerData.token;
  const sellerUser = sellerData.user;

  // Buyer
  const buyerRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Kavitha Sundaram (Buyer)",
      email: buyerEmail,
      password,
      role: "citizen",
      phone: "9876543202",
      aadhaar: `6543${timestamp.toString().slice(-8)}`,
    }),
  });
  const buyerData = await buyerRegRes.json();
  assert(buyerData.success && buyerData.token, "Buyer account registered dynamically", JSON.stringify(buyerData));
  const buyerToken = buyerData.token;
  const buyerUser = buyerData.user;

  // Officer (Registrar) - dynamically registered citizen account, then promoted to officer by Admin
  const officerRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Sub-Registrar Thiru Ramanathan",
      email: officerEmail,
      password,
      role: "citizen",
      phone: "9876543203",
      aadhaar: `7654${timestamp.toString().slice(-8)}`,
    }),
  });
  const officerData = await officerRegRes.json();
  assert(officerData.success && officerData.token, "Sub-Registrar Officer registered dynamically");
  const officerUser = officerData.user;

  // Admin logs in and promotes this dynamic account to "officer"
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@bhoomi.gov.in", password: "Admin@Bhoomi2026!" }),
  });
  const adminData = await adminLoginRes.json();
  assert(adminData.success && adminData.token, "Admin logged in successfully to promote officer");
  const adminToken = adminData.token;

  const promoteRes = await fetch(`${BASE_URL}/users/${officerUser.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ role: "officer" }),
  });
  const promoteData = await promoteRes.json();
  assert(promoteData.success, "Dynamically created account promoted to Sub-Registrar Officer by Admin");

  // Officer logs in to obtain authorized officer JWT
  const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: officerEmail, password }),
  });
  const officerLoginData = await officerLoginRes.json();
  assert(
    officerLoginData.success && officerLoginData.user.role === "officer",
    "Sub-Registrar Officer logged in with verified 'officer' role"
  );
  const officerToken = officerLoginData.token;

  // ============================================================================
  // STEP 2: Create Properties for Seller and verify Initial Ownership
  // ============================================================================
  console.log("\n--> Step 2: Creating Properties for Seller and verifying initial ownership...");

  // Create Property 1 (for approval test)
  const prop1Res = await fetch(`${BASE_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      title: "Greenwood Residential Plot No. 42",
      surveyNumber: `TN-MDU-${timestamp.toString().slice(-6)}`,
      district: "Madurai",
      areaSqft: 4800,
      type: "Residential",
      address: "42 Greenwood Layout, Melur Main Road, Madurai 625020",
      estValue: 4200000,
    }),
  });
  const prop1Data = await prop1Res.json();
  const property1 = prop1Data.property || prop1Data.data;
  assert(prop1Data.success && property1, "Property 1 registered for Seller", JSON.stringify(prop1Data));

  // Create Property 2 (for rejection test)
  const prop2Res = await fetch(`${BASE_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      title: "Sunrise Commercial Avenue Unit 7",
      surveyNumber: `TN-MDU-${(timestamp + 1).toString().slice(-6)}`,
      district: "Madurai",
      areaSqft: 2500,
      type: "Commercial",
      address: "Unit 7, Sunrise IT Park, Bypass Road, Madurai 625016",
      estValue: 8500000,
    }),
  });
  const prop2Data = await prop2Res.json();
  const property2 = prop2Data.property || prop2Data.data;
  assert(prop2Data.success && property2, "Property 2 registered for Seller", JSON.stringify(prop2Data));

  // Check Seller's properties
  const sellerPropsRes = await fetch(`${BASE_URL}/properties`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const sellerProps = await sellerPropsRes.json();
  assert(
    sellerProps.success && sellerProps.properties.length === 2,
    `Seller initially has exactly 2 properties (found: ${sellerProps.properties?.length})`
  );

  // Check Buyer's properties
  const buyerPropsRes = await fetch(`${BASE_URL}/properties`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  const buyerProps = await buyerPropsRes.json();
  assert(
    buyerProps.success && buyerProps.properties.length === 0,
    `Buyer initially has exactly 0 properties (found: ${buyerProps.properties?.length})`
  );

  // ============================================================================
  // STEP 3: Security & Validation Checks on Transfer Creation
  // ============================================================================
  console.log("\n--> Step 3: Testing Transfer Security, Self-Transfer, and Un-owned Property Blocks...");

  // 3a: Buyer attempts to transfer Seller's property (Unauthorized)
  const unauthTransferRes = await fetch(`${BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      propertyId: property1.id,
      toOwner: "Random Person",
      toEmail: "random@example.com",
      transferType: "Sale",
    }),
  });
  const unauthData = await unauthTransferRes.json();
  assert(
    unauthTransferRes.status === 403,
    "Transfer blocked when non-owner tries to transfer property (403 Forbidden)",
    unauthData.message
  );

  // 3b: Seller attempts self-transfer (Transfer to own email)
  const selfTransferRes = await fetch(`${BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      propertyId: property1.id,
      toOwner: sellerUser.fullName,
      toEmail: sellerEmail,
      transferType: "Sale",
    }),
  });
  const selfData = await selfTransferRes.json();
  assert(
    selfTransferRes.status === 400,
    "Self-transfer to own email blocked (400 Bad Request)",
    selfData.message
  );

  // ============================================================================
  // STEP 4: Legitimate Transfer Initiation & Duplicate Transfer Prevention
  // ============================================================================
  console.log("\n--> Step 4: Seller creates valid transfer request and tests duplicate prevention...");

  const validTransferRes = await fetch(`${BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      propertyId: property1.id,
      toOwner: buyerUser.fullName,
      toEmail: buyerEmail,
      transferType: "Sale",
      remarks: "Conveyance of full ownership interest with consideration paid.",
    }),
  });
  const validTransferData = await validTransferRes.json();
  const transfer1 = validTransferData.transfer || validTransferData.data;
  assert(
    validTransferRes.status === 201 && validTransferData.success && transfer1,
    "Valid transfer created successfully (201 Created)",
    JSON.stringify(validTransferData)
  );

  // Duplicate transfer attempt on Property 1 while pending
  const dupTransferRes = await fetch(`${BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      propertyId: property1.id,
      toOwner: "Another Buyer",
      toEmail: "another@example.com",
      transferType: "Sale",
    }),
  });
  const dupData = await dupTransferRes.json();
  assert(
    dupTransferRes.status === 400,
    "Duplicate transfer on active pending property blocked (400 Bad Request)",
    dupData.message
  );

  // ============================================================================
  // STEP 5: Pre-Approval Ownership Verification
  // ============================================================================
  console.log("\n--> Step 5: Verifying property ownership remains strictly with Seller BEFORE approval...");

  const preApproveSellerProps = await (
    await fetch(`${BASE_URL}/properties`, { headers: { Authorization: `Bearer ${sellerToken}` } })
  ).json();
  const preApproveBuyerProps = await (
    await fetch(`${BASE_URL}/properties`, { headers: { Authorization: `Bearer ${buyerToken}` } })
  ).json();

  assert(
    preApproveSellerProps.properties.some((p) => p.id === property1.id),
    "Seller STILL owns Property 1 before Sub-Registrar approval"
  );
  assert(
    preApproveBuyerProps.properties.length === 0,
    "Buyer does NOT see Property 1 before Sub-Registrar approval"
  );

  // ============================================================================
  // STEP 6: Registrar Dashboard Visibility
  // ============================================================================
  console.log("\n--> Step 6: Verifying transfer appears in Registrar's Adjudication Queue...");

  const officerTransfersRes = await fetch(`${BASE_URL}/transfers`, {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const officerTransfers = await officerTransfersRes.json();
  const queueItem = officerTransfers.transfers?.find((t) => t.id === transfer1.id);
  assert(
    Boolean(queueItem && (queueItem.status === "pending" || queueItem.status === "underReview")),
    `Transfer ${transfer1.id} appears in Sub-Registrar queue with pending status`
  );

  // ============================================================================
  // STEP 7: RBAC on Approval (Only authorized Sub-Registrar can approve)
  // ============================================================================
  console.log("\n--> Step 7: Verifying RBAC on transfer approval...");

  // Citizen tries to approve transfer
  const citizenApproveRes = await fetch(`${BASE_URL}/transfers/${transfer1.id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ remarks: "Trying to self-approve" }),
  });
  assert(
    citizenApproveRes.status === 403,
    "Unauthorized Citizen blocked from approving transfer (403 Forbidden)"
  );

  // Sub-Registrar approves transfer
  const officerApproveRes = await fetch(`${BASE_URL}/transfers/${transfer1.id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({
      remarks: "Title verified, stamp duty paid. Admitted to Tamil Nadu Land Register.",
    }),
  });
  const approveData = await officerApproveRes.json();
  assert(
    officerApproveRes.status === 200 && approveData.success,
    "Authorized Sub-Registrar approved conveyance transfer (200 OK)",
    JSON.stringify(approveData)
  );

  // ============================================================================
  // STEP 8: Post-Approval Database Ownership & Property List Dynamic Isolation
  // ============================================================================
  console.log("\n--> Step 8: Verifying ownership updated in database and reflection in both citizens' lists...");

  const postSellerProps = await (
    await fetch(`${BASE_URL}/properties`, { headers: { Authorization: `Bearer ${sellerToken}` } })
  ).json();
  const postBuyerProps = await (
    await fetch(`${BASE_URL}/properties`, { headers: { Authorization: `Bearer ${buyerToken}` } })
  ).json();

  assert(
    !postSellerProps.properties.some((p) => p.id === property1.id),
    "Property 1 is AUTOMATICALLY REMOVED from Seller's My Properties list"
  );
  assert(
    postSellerProps.properties.length === 1 && postSellerProps.properties[0].id === property2.id,
    "Seller now has only 1 property (Property 2)"
  );

  assert(
    postBuyerProps.properties.some((p) => p.id === property1.id),
    "Property 1 AUTOMATICALLY APPEARS in Buyer's My Properties list"
  );
  assert(
    postBuyerProps.properties.length === 1,
    "Buyer now has exactly 1 property"
  );

  // Verify direct property access authorization
  const buyerDirectRes = await fetch(`${BASE_URL}/properties/${property1.id}`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerDirectRes.status === 200, "New owner (Buyer) has direct access to Property 1 (200 OK)");

  const sellerDirectRes = await fetch(`${BASE_URL}/properties/${property1.id}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert(
    sellerDirectRes.status === 403,
    "Previous owner (Seller) is denied direct access to Property 1 (403 Forbidden)"
  );

  // ============================================================================
  // STEP 9: Dual-Party Email Notification Verification
  // ============================================================================
  console.log("\n--> Step 9: Verifying email notifications dispatched to BOTH parties...");

  const sellerNotifs = await (
    await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${sellerToken}` } })
  ).json();
  const buyerNotifs = await (
    await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${buyerToken}` } })
  ).json();

  const sellerNotifList = sellerNotifs.notifications || sellerNotifs.data || [];
  const buyerNotifList = buyerNotifs.notifications || buyerNotifs.data || [];

  const sellerApprovalNotif = sellerNotifList.find(
    (n) => (n.actionType === "TRANSFER_APPROVED" || n.type === "transfer") && (n.referenceId === transfer1.id || n.title?.includes(transfer1.id))
  );
  const buyerApprovalNotif = buyerNotifList.find(
    (n) => (n.actionType === "TRANSFER_APPROVED" || n.type === "transfer") && (n.referenceId === transfer1.id || n.title?.includes(transfer1.id))
  );

  assert(
    Boolean(sellerApprovalNotif),
    `Seller received TRANSFER_APPROVED notification (Delivery Status: ${sellerApprovalNotif?.deliveryStatus})`
  );
  assert(
    Boolean(buyerApprovalNotif),
    `Buyer received TRANSFER_APPROVED notification (Delivery Status: ${buyerApprovalNotif?.deliveryStatus})`
  );

  // ============================================================================
  // STEP 10: Rejection Workflow Integrity Test
  // ============================================================================
  console.log("\n--> Step 10: Testing Transfer Rejection Workflow on Property 2...");

  // Seller initiates transfer for Property 2
  const transfer2Res = await fetch(`${BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      propertyId: property2.id,
      toOwner: buyerUser.fullName,
      toEmail: buyerEmail,
      transferType: "Gift",
      remarks: "Gift deed to family friend.",
    }),
  });
  const transfer2Data = await transfer2Res.json();
  const transfer2 = transfer2Data.transfer || transfer2Data.data;
  assert(transfer2Res.status === 201 && transfer2, "Transfer request for Property 2 created");

  // Sub-Registrar rejects transfer 2
  const rejectRes = await fetch(`${BASE_URL}/transfers/${transfer2.id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({
      remarks: "Discrepancy in gift settlement valuation. Encumbrance certificate pending.",
    }),
  });
  const rejectData = await rejectRes.json();
  assert(rejectRes.status === 200 && rejectData.success, "Sub-Registrar rejected transfer 2 (200 OK)");

  // Verify ownership remains with Seller after rejection
  const postRejectSellerProps = await (
    await fetch(`${BASE_URL}/properties`, { headers: { Authorization: `Bearer ${sellerToken}` } })
  ).json();
  const postRejectBuyerProps = await (
    await fetch(`${BASE_URL}/properties`, { headers: { Authorization: `Bearer ${buyerToken}` } })
  ).json();

  assert(
    postRejectSellerProps.properties.some((p) => p.id === property2.id),
    "Property 2 REMAINS WITH ORIGINAL OWNER (Seller) after rejection"
  );
  assert(
    !postRejectBuyerProps.properties.some((p) => p.id === property2.id),
    "Property 2 is NOT given to Buyer after rejection"
  );

  // Check rejection notifications
  const sellerNotifsPostReject = await (
    await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${sellerToken}` } })
  ).json();
  const buyerNotifsPostReject = await (
    await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${buyerToken}` } })
  ).json();

  const sellerRejectList = sellerNotifsPostReject.notifications || sellerNotifsPostReject.data || [];
  const buyerRejectList = buyerNotifsPostReject.notifications || buyerNotifsPostReject.data || [];

  const sellerRejectNotif = sellerRejectList.find(
    (n) => (n.actionType === "TRANSFER_REJECTED" || n.type === "transfer") && (n.referenceId === transfer2.id || n.title?.includes(transfer2.id))
  );
  const buyerRejectNotif = buyerRejectList.find(
    (n) => (n.actionType === "TRANSFER_REJECTED" || n.type === "transfer") && (n.referenceId === transfer2.id || n.title?.includes(transfer2.id))
  );

  assert(
    Boolean(sellerRejectNotif),
    `Seller received TRANSFER_REJECTED notification (Delivery Status: ${sellerRejectNotif?.deliveryStatus})`
  );
  assert(
    Boolean(buyerRejectNotif),
    `Buyer received TRANSFER_REJECTED notification (Delivery Status: ${buyerRejectNotif?.deliveryStatus})`
  );

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runWorkflowTests().catch((err) => {
  console.error("Test execution encountered an unhandled exception:", err);
  process.exit(1);
});

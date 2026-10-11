export async function handleChatbotMessage(req, res) {
  const { message } = req.body;
  const query = String(message || "").trim().toLowerCase();

  let reply = "";
  let suggestions = [];

  if (!query) {
    return res.json({
      success: true,
      reply: "Hello! I am Bhoomi Assistant, your land registration guide. How can I help you today?",
      suggestions: ["How do I register a property?", "What documents are required?", "Calculate stamp duty", "How does deed QR verification work?"],
    });
  }

  if (query.includes("how") && (query.includes("register") || query.includes("apply") || query.includes("steps"))) {
    reply = `To register your land or property on Bhoomi Registry:
1. Navigate to **Property Registration** in the menu.
2. Enter property details (Title, Type, Extent in Sq.Ft, Market Value).
3. Select your exact land coordinates using the interactive **Google Map / Cadastral Map**.
4. Choose the registration date from the **Calendar Picker**.
5. Upload supporting documents (Draft Sale Deed, Patta, or ID proof).
6. Confirm the 1.5% registration fee and submit.
Your application is automatically routed to the Licensed Surveyor for boundary verification, followed by Registrar approval and Digital Deed generation!`;
    suggestions = ["What documents are required?", "How long does verification take?", "Track my application"];
  } else if (query.includes("document") || query.includes("doc") || query.includes("proof")) {
    reply = `Mandatory documents for Land & Property Registration:
• **Primary Title Deed / Sale Deed**: Previous registered deed or sale agreement.
• **Patta / Chitta / Cadastral Record**: State land revenue record proving classification.
• **Encumbrance Certificate (EC)**: Ensuring no pre-existing mortgage or legal claims.
• **Government ID Proof**: Aadhaar Card, PAN Card, or Voter ID of Buyer and Seller.
• **Survey Field Measurement Book (FMB) Sketch**: Boundary demarcations.`;
    suggestions = ["How do I register a property?", "Calculate stamp duty", "Surveyor verification"];
  } else if (query.includes("fee") || query.includes("cost") || query.includes("duty") || query.includes("calculate") || query.includes("price") || query.includes("stamp")) {
    reply = `Fee Structure on Bhoomi Portal:
• **Registration Fee**: Approximately 1% - 1.5% of the estimated property market value.
• **Stamp Duty**: Typically 5% - 7% depending on property classification (Residential / Commercial).
• **Survey & Boundary Verification Fee**: Included in the processing fee.
You can review the exact calculated amount on Step 3 of the Registration workflow before submitting!`;
    suggestions = ["Start property registration", "What documents are required?"];
  } else if (query.includes("survey") || query.includes("boundary") || query.includes("surveyor")) {
    reply = `Surveyor Verification Workflow:
Once you submit your application, a Licensed Government Surveyor is assigned to:
1. Review the parcel coordinates and Survey Number.
2. Inspect the boundary markers and ground extent against the Cadastral map.
3. Certify boundary measurements and record official survey remarks.
Once verified, the application advances to the Sub-Registrar's final review. You will receive an automated email notification as soon as the survey is sealed!`;
    suggestions = ["How long does verification take?", "What happens after approval?"];
  } else if (query.includes("qr") || query.includes("deed") || query.includes("verify") || query.includes("pdf")) {
    reply = `Digital Deed & QR Code Security:
Upon Sub-Registrar approval:
• An immutable **Digital Title Deed** is generated with a unique Deed Number.
• A secure **QR Code** is embossed directly on the certificate.
• Anyone scanning the QR code with any smartphone camera is taken to the official public verification page displaying real-time authenticity, registrar seal, and the SHA-256 cryptographic hash.
• You can download the official **Government PDF Deed** at any time!`;
    suggestions = ["Track my application", "How do I register a property?"];
  } else if (query.includes("track") || query.includes("status") || query.includes("ref")) {
    reply = `You can check the live progress of any application anytime:
• Click **Track Application** on the navigation bar.
• Enter your Application Reference Number (e.g., \`REG-2026-0001\`) or Deed Number (e.g., \`DEED-2026-...\`).
• You'll see the complete 6-stage Verification Timeline from submission to final deed issue.`;
    suggestions = ["Track application now", "How do I register a property?"];
  } else {
    reply = `I can assist you with all aspects of Bhoomi Land Registry:
• Step-by-step guidance on **Property Registration**
• List of **Mandatory Documents**
• **Stamp Duty & Registration Fee** estimates
• **Surveyor & Registrar Verification** workflow
• **Digital Deed & QR Code** verification
What would you like to know more about?`;
    suggestions = ["How do I register a property?", "What documents are required?", "Calculate stamp duty", "How does deed QR verification work?"];
  }

  res.json({
    success: true,
    reply,
    suggestions,
  });
}

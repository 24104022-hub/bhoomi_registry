import QRCode from "qrcode";

export async function generateDeedQRCode(deedNumber, frontendBaseUrl = "http://localhost:5173") {
  const verificationUrl = `${frontendBaseUrl}/verify-deed/${encodeURIComponent(deedNumber)}`;

  try {
    // Generate base64 Data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 280,
      color: {
        dark: "#143325", // Bhoomi forest green
        light: "#FFFFFF",
      },
    });

    return {
      qrDataUrl,
      verificationUrl,
    };
  } catch (err) {
    console.error("QR Code generation error:", err);
    throw err;
  }
}

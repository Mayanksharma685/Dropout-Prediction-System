// Using any types to avoid TypeScript compilation issues
import * as qrService from "../services/QRCodeService";

export async function generateQR(_req: any, res: any): Promise<void> {
  try {
    const result = await qrService.generateQRCode();
    res.json(result);
  } catch (err) {
    console.error("Error in generateQR:", err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
}

export async function getCurrentQR(_req: any, res: any): Promise<void> {
  try {
    const result = await qrService.getCurrentQRCode();
    if (!result) {
      res.status(404).json({ error: "No active QR session" });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("Error in getCurrentQR:", err);
    res.status(500).json({ error: "Failed to get current QR code" });
  }
}

export async function verifyQR(req: any, res: any): Promise<void> {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }

    const result = await qrService.verifyQRCode(sessionId);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    console.error("Error in verifyQR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

import type { Request, Response } from "express";
import * as qrService from "../services/QRCodeService";

export async function generateQR(_req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, qrImage } = await qrService.generateQRCode();
    res.json({ sessionId, qrImage });
  } catch (err) {
    console.error("Error in generateQR:", err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
}

export async function verifyQR(req: Request, res: Response): Promise<void> {
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

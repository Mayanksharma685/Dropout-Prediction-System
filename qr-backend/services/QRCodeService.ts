import QRCode from "qrcode";
import crypto from "crypto";
import { redis } from "../config/redisClient";

interface QRSession {
  eventId: string;
  createdAt: number;
}

interface GenerateQRResponse {
  qrImage: string;
  sessionId: string;
  createdAt: number;
}

interface VerifyQRResponse {
  success: boolean;
  error?: string;
  message?: string;
  sessionId?: string;
  eventId?: string;
}

export async function generateQRCode(): Promise<GenerateQRResponse> {
  try {
    // Delete any previous active QR session
    const current = await redis.get("qr:current");
    if (current) {
      const { sessionId } = JSON.parse(current) as { sessionId: string };
      await redis.del(`qr:session:${sessionId}`);
      await redis.del("qr:current");
    }

    // Create a new QR session
    const sessionId = crypto.randomUUID();
    const createdAt = Math.floor(Date.now() / 1000);

    // Store session in Redis (30s expiry)
    const sessionData: QRSession = { eventId: "attend2025", createdAt };
    await redis.set(`qr:session:${sessionId}`, JSON.stringify(sessionData), { EX: 30 });

    // Mark as the current QR
    await redis.set("qr:current", JSON.stringify({ sessionId, createdAt }), { EX: 30 });

    // Generate QR Code image
    const qrImage = await QRCode.toDataURL(JSON.stringify({ sessionId }));

    return { qrImage, sessionId, createdAt };
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

export async function verifyQRCode(sessionId: string): Promise<VerifyQRResponse> {
  try {
    const current = await redis.get("qr:current");
    if (!current) {
      return { success: false, error: "No active QR" };
    }

    const { sessionId: activeSessionId, createdAt } = JSON.parse(current) as {
      sessionId: string;
      createdAt: number;
    };

    if (sessionId !== activeSessionId) {
      return { success: false, error: "QR already rolled out (expired)" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now - createdAt >= 30) {
      return { success: false, error: "QR expired" };
    }

    return {
      success: true,
      message: "Attendance marked successfully",
      sessionId,
      eventId: "attend2025",
    };
  } catch (error) {
    console.error("Error verifying QR code:", error);
    return { success: false, error: "Internal server error" };
  }
}

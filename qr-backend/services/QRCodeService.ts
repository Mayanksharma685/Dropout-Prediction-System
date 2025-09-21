import QRCode from "qrcode";
import crypto from "crypto";
import { redis } from "../config/redisClient";

interface QRSession {
  eventId: string;
  createdAt: number;
  shuffleIndex: number;
  baseSessionId: string;
}

interface GenerateQRResponse {
  qrImage: string;
  sessionId: string;
  createdAt: number;
  shuffleIndex: number;
  baseSessionId: string;
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
      const { baseSessionId } = JSON.parse(current) as { baseSessionId: string };
      // Clean up all shuffled sessions
      for (let i = 0; i < 6; i++) {
        await redis.del(`qr:session:${baseSessionId}_${i}`);
      }
      await redis.del("qr:current");
    }

    // Create a new base session ID
    const baseSessionId = crypto.randomUUID();
    const createdAt = Math.floor(Date.now() / 1000);

    // Generate all 6 shuffled QR codes for the 30-second session
    const shuffledSessions = [];
    for (let i = 0; i < 6; i++) {
      const shuffledSessionId = `${baseSessionId}_${i}`;
      const sessionData: QRSession = { 
        eventId: "attend2025", 
        createdAt, 
        shuffleIndex: i,
        baseSessionId 
      };
      
      // Store each shuffled session in Redis (35s expiry for safety)
      await redis.set(`qr:session:${shuffledSessionId}`, JSON.stringify(sessionData), { EX: 35 });
      shuffledSessions.push(shuffledSessionId);
    }

    // Mark as the current QR session
    await redis.set("qr:current", JSON.stringify({ 
      baseSessionId, 
      createdAt, 
      shuffledSessions 
    }), { EX: 35 });

    // Generate the first QR Code (index 0)
    const currentSessionId = `${baseSessionId}_0`;
    const qrImage = await QRCode.toDataURL(JSON.stringify({ 
      sessionId: currentSessionId,
      shuffleIndex: 0,
      baseSessionId 
    }));

    return { qrImage, sessionId: currentSessionId, createdAt, shuffleIndex: 0, baseSessionId };
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

export async function getCurrentQRCode(): Promise<GenerateQRResponse | null> {
  try {
    const current = await redis.get("qr:current");
    if (!current) {
      return null;
    }

    const { baseSessionId, createdAt } = JSON.parse(current) as {
      baseSessionId: string;
      createdAt: number;
    };

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - createdAt;

    // Check if session has expired (30 seconds)
    if (elapsed >= 30) {
      return null;
    }

    // Calculate current shuffle index (changes every 5 seconds)
    const shuffleIndex = Math.floor(elapsed / 5);
    if (shuffleIndex >= 6) {
      return null;
    }

    // Generate current QR code
    const currentSessionId = `${baseSessionId}_${shuffleIndex}`;
    const qrImage = await QRCode.toDataURL(JSON.stringify({ 
      sessionId: currentSessionId,
      shuffleIndex,
      baseSessionId 
    }));

    return { qrImage, sessionId: currentSessionId, createdAt, shuffleIndex, baseSessionId };
  } catch (error) {
    console.error("Error getting current QR code:", error);
    return null;
  }
}

export async function verifyQRCode(sessionId: string): Promise<VerifyQRResponse> {
  try {
    const current = await redis.get("qr:current");
    if (!current) {
      return { success: false, error: "No active QR session" };
    }

    const { baseSessionId, createdAt } = JSON.parse(current) as {
      baseSessionId: string;
      createdAt: number;
    };

    // Check if the session has expired (30 seconds total)
    const now = Math.floor(Date.now() / 1000);
    if (now - createdAt >= 30) {
      return { success: false, error: "QR session expired" };
    }

    // Check if the provided sessionId is one of the valid shuffled sessions
    const sessionData = await redis.get(`qr:session:${sessionId}`);
    if (!sessionData) {
      return { success: false, error: "Invalid QR code" };
    }

    const session: QRSession = JSON.parse(sessionData);
    
    // Verify the session belongs to the current base session
    if (session.baseSessionId !== baseSessionId) {
      return { success: false, error: "QR code from different session" };
    }

    // Calculate current valid shuffle index
    const elapsed = now - createdAt;
    const currentShuffleIndex = Math.floor(elapsed / 5);
    
    // Allow current and previous shuffle index for timing tolerance (2-3 second window)
    const validIndices = [currentShuffleIndex];
    if (currentShuffleIndex > 0) {
      validIndices.push(currentShuffleIndex - 1);
    }

    if (!validIndices.includes(session.shuffleIndex)) {
      return { success: false, error: "QR code expired - please scan the current code" };
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

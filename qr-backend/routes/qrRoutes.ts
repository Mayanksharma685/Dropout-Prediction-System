import express from "express";
import { generateQR, getCurrentQR, verifyQR } from "../controllers/qrController";

const router = express.Router();

router.get("/generate-qr", generateQR);
router.get("/current-qr", getCurrentQR);
router.post("/verify-qr", verifyQR);

export default router;

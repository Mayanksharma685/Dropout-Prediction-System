import express from "express";
import { generateQR, verifyQR } from "../controllers/qrController";

const router = express.Router();

router.get("/generate-qr", generateQR);
router.post("/verify-qr", verifyQR);

export default router;

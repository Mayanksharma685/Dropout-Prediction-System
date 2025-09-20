import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import qrRoutes from "./routes/qrRoutes";
import { connectRedis } from "./config/redisClient";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend is working ✅");
});

app.use("/api/qr", qrRoutes);

const PORT = process.env.PORT || 3000;

connectRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("Redis connection failed:", err.message);
  });

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Rejection:", reason);
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import surveyorRoutes from "./routes/surveyorRoutes.js";
import registrarRoutes from "./routes/registrarRoutes.js";
import deedRoutes from "./routes/deedRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import landParcelRoutes from "./routes/landParcelRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting both Vite dev proxy and direct frontend calls
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);
app.options("*", cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Static uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Root & Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "Bhoomi Land Registration & Property Management System",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes); // Fallback mount in case OAuth callback hits /auth directly
app.use("/api/properties", propertyRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/surveyor", surveyorRoutes);
app.use("/api/registrar", registrarRoutes);
app.use("/api/deeds", deedRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/land-parcels", landParcelRoutes);

// Catch 404 for API
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

// Start Server & Connect Database
async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(`Bhoomi Land Registry Backend running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Backend Server] Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Backend Server] Uncaught Exception:", error);
});

startServer();

export default app;

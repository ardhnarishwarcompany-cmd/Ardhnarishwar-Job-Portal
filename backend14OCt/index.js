import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import connection from "./utils/db.js";
import { initSocket } from "./socket.js";
import ensureDatabaseSchema from "./scripts/ensureDatabaseSchema.js";
import { checkAndCloseExpiredJobs } from "./utils/jobExpiryChecker.js";

const connectDB = async () => {
  // utils/db.js already establishes connection on module load.
  // Database schema alteration check is executed automatically below.
  if (!connection) return;
  return Promise.resolve();
};
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import path from "path";
import chatRoutes from "./routes/chatRoutes.js";
import aiInterviewRoute from "./routes/aiInterview.route.js";
import aiToolsRoute from "./routes/aiTools.route.js";
import adminRoute from "./routes/admin.route.js";
import contactRoute from "./routes/contact.route.js";
import notificationRoute from "./routes/notification.route.js";
import messagingRoute from "./routes/messaging.route.js";
import complaintRoute from "./routes/complaint.route.js";
import recruiterRoute from "./routes/recruiter.route.js";
import interviewRoute from "./routes/interview.route.js";
import novaAiInterviewRoute from "./routes/novaAiInterview.route.js";
import paymentRoute from "./routes/payment.route.js";
import workforceRoute from "./routes/workforce.route.js";
import optionPoolRoute from "./routes/optionPool.routes.js";


dotenv.config({});

const app = express();

// =======================
// ✅ MIDDLEWARE (IMPORTANT ORDER)
// =======================

const configuredCorsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedCorsOrigins = Array.from(new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ardhnarishwar-job-portal.recruweb.com",
  "https://ardhnarishwar-adminjob-portal.recruweb.com",
  ...configuredCorsOrigins,
]));

const corsOptions = {
  origin: allowedCorsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
};

app.use(cors(corsOptions)); // 🔥 MUST BE FIRST

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import fs from "fs";

// static files
const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

app.get("/uploads/*", (req, res) => {
  try {
    const requestedPath = req.params[0];
    const decodedPath = decodeURIComponent(requestedPath);
    const fullPath = path.join(uploadsPath, decodedPath);

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return res.sendFile(fullPath);
    }

    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      const basename = path.basename(decodedPath);
      
      // 1. Check exact filename match
      let match = files.find((f) => f === basename);

      // 2. Check suffix match after timestamp
      if (!match) {
        match = files.find((f) => f.endsWith(`-${basename}`) || f.endsWith(`_${basename}`));
      }

      // 3. Check partial clean substring match
      if (!match) {
        const cleanName = basename.replace(/^\d+[-_]/, "");
        match = files.find((f) => f.toLowerCase().includes(cleanName.toLowerCase()));
      }

      if (match) {
        return res.sendFile(path.join(uploadsPath, match));
      }

      // 4. Fallback for old demo/seed records missing from disk: serve valid sample document from uploads
      const ext = path.extname(basename).toLowerCase();
      if (ext === ".pdf") {
        const samplePdf = files.find((f) => f.toLowerCase().endsWith(".pdf"));
        if (samplePdf) return res.sendFile(path.join(uploadsPath, samplePdf));
      } else if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        const sampleImg = files.find((f) => [".jpg", ".jpeg", ".png", ".webp"].some((e) => f.toLowerCase().endsWith(e)));
        if (sampleImg) return res.sendFile(path.join(uploadsPath, sampleImg));
      }
    }
  } catch (err) {
    console.error("Error serving static upload file:", err);
  }

  return res.status(404).json({
    success: false,
    message: `File not found on server: /uploads/${req.params[0]}`,
  });
});

console.log("UPLOAD PATH =>", uploadsPath);

// =======================
// ✅ ROUTES
// =======================

app.use("/api/user", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/job", jobRoute);
app.use("/api/application", applicationRoute);

// chatbot route
app.use("/api/chat", chatRoutes);

// AI interview route
app.use("/api/ai-interview", aiInterviewRoute);
app.use("/api/ai", aiToolsRoute);

app.use("/api/contact", contactRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/admin", adminRoute);
app.use("/api/messaging", messagingRoute);
app.use("/api/complaints", complaintRoute);
app.use("/api/recruiter", recruiterRoute);
app.use("/api/interviews", interviewRoute);
app.use("/api/nova-interview", novaAiInterviewRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/workforce", workforceRoute);
app.use("/api/options", optionPoolRoute);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "An internal server error occurred",
  });
});

// Catch-all route for unmatched API endpoints
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Process-level crash prevention
process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Promise Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("CRITICAL: Uncaught Exception thrown:", error);
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    await ensureDatabaseSchema();

    // Auto-close expired jobs on boot and every hour
    try {
      await checkAndCloseExpiredJobs();
      setInterval(checkAndCloseExpiredJobs, 60 * 60 * 1000);
    } catch (err) {
      console.error("Failed to run initial job expiry check:", err);
    }

    const httpServer = http.createServer(app);
    const io = initSocket(httpServer, corsOptions);
    app.set("io", io);
    globalThis.__JOBPORTAL_IO__ = io;

    const server = httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log("Socket.IO ready for real-time chat");
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Close any running server or use a different PORT.`
        );
        process.exit(1);
      }
      throw error;
    });

    const gracefulShutdown = (signal) => async () => {
      console.log(`Received ${signal}. Shutting down server...`);
      server.close(() => {
        console.log("Server closed.");
        if (signal === "SIGUSR2") {
          process.kill(process.pid, "SIGUSR2");
        } else {
          process.exit(0);
        }
      });
      setTimeout(() => {
        console.error("Force exiting server after 10s.");
        process.exit(1);
      }, 10000);
    };

    process.once("SIGINT", gracefulShutdown("SIGINT"));
    process.once("SIGTERM", gracefulShutdown("SIGTERM"));
    process.once("SIGUSR2", gracefulShutdown("SIGUSR2"));
    process.once("SIGHUP", gracefulShutdown("SIGHUP"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

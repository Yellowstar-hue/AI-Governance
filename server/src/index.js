const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { pool } = require("./config/database");
const { connectRedis } = require("./config/redis");

// Core route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const organizationRoutes = require("./routes/organizations");
const modelRoutes = require("./routes/models");
const riskRoutes = require("./routes/risks");
const complianceRoutes = require("./routes/compliance");
const vendorRoutes = require("./routes/vendors");
const incidentRoutes = require("./routes/incidents");
const policyRoutes = require("./routes/policies");
const reportRoutes = require("./routes/reports");
const evidenceRoutes = require("./routes/evidence");
const dashboardRoutes = require("./routes/dashboard");
const frameworkRoutes = require("./routes/frameworks");
const auditRoutes = require("./routes/audit");

// SaaS feature route imports
const subscriptionRoutes = require("./routes/subscriptions");
const notificationRoutes = require("./routes/notifications");
const webhookRoutes = require("./routes/webhooksRoute");
const uploadRoutes = require("./routes/uploads");
const aiAdvisorRoutes = require("./routes/aiAdvisor");
const trustCenterRoutes = require("./routes/trustCenter");
const assessmentRoutes = require("./routes/assessments");
const searchRoutes = require("./routes/search");
const commentRoutes = require("./routes/comments");
const dataProcessingRoutes = require("./routes/dataProcessing");
const policyTemplateRoutes = require("./routes/policyTemplates");
const reportsExportRoutes = require("./routes/reportsExport");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("combined"));

// Health check - always returns 200 so Railway doesn't kill the container
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "AISafe API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint - check DB and tables
app.get("/api/status", async (req, res) => {
  const checks = { database: false, tables: false, tableList: [], env: {} };
  checks.env = {
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "NOT SET",
    JWT_SECRET: process.env.JWT_SECRET ? "set" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV || "not set",
    PORT: process.env.PORT || "not set",
  };

  try {
    await pool.query("SELECT 1");
    checks.database = true;

    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    checks.tableList = tables.rows.map((r) => r.table_name);
    checks.tables = checks.tableList.includes("users");
  } catch (err) {
    checks.dbError = err.message;
  }

  res.json(checks);
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/risks", riskRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/frameworks", frameworkRoutes);
app.use("/api/audit", auditRoutes);

// SaaS feature routes
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/ai-advisor", aiAdvisorRoutes);
app.use("/api/trust-center", trustCenterRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/data-processing", dataProcessingRoutes);
app.use("/api/policy-templates", policyTemplateRoutes);
app.use("/api/reports-export", reportsExportRoutes);

// Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// Serve React frontend in production (single-service Railway deployment)
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// SPA fallback: any non-API route serves the React app
app.get("*", (req, res, next) => {
  // Don't serve frontend for API routes
  if (req.path.startsWith("/api/") || req.path === "/health") {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Start server
const start = async () => {
  await connectRedis();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AISafe API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

start();

module.exports = app;

const express = require("express");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { generateComplianceReport, generateDPIAReport } = require("../services/reportGenerator");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Generate comprehensive compliance report (JSON for frontend PDF rendering)
router.get("/compliance-full", async (req, res) => {
  try {
    const report = await generateComplianceReport(req.orgId);
    res.json({ report });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Generate DPIA report for a model
router.get("/dpia/:modelId", async (req, res) => {
  try {
    const report = await generateDPIAReport(req.orgId, req.params.modelId);
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate DPIA report" });
  }
});

module.exports = router;

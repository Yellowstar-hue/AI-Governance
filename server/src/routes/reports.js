const express = require("express");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Compliance summary report
router.get("/compliance-summary", async (req, res) => {
  try {
    const [frameworks, risks, incidents] = await Promise.all([
      pool.query(
        `SELECT f.name, f.short_code,
           COUNT(cr.id) as total,
           COUNT(CASE WHEN cr.status = 'compliant' THEN 1 END) as compliant,
           COUNT(CASE WHEN cr.status = 'non_compliant' THEN 1 END) as non_compliant
         FROM frameworks f
         LEFT JOIN compliance_requirements cr ON cr.framework_id = f.id AND cr.organization_id = $1
         WHERE f.is_active = true GROUP BY f.id, f.name, f.short_code`,
        [req.orgId]
      ),
      pool.query(
        `SELECT severity, COUNT(*) as count FROM risks
         WHERE organization_id = $1 GROUP BY severity`,
        [req.orgId]
      ),
      pool.query(
        `SELECT status, COUNT(*) as count FROM incidents
         WHERE organization_id = $1 GROUP BY status`,
        [req.orgId]
      ),
    ]);

    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        complianceByFramework: frameworks.rows,
        risksBySeverity: risks.rows,
        incidentsByStatus: incidents.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Risk assessment report
router.get("/risk-assessment", async (req, res) => {
  try {
    const [byCategory, byModel, trends] = await Promise.all([
      pool.query(
        `SELECT category, severity, COUNT(*) as count FROM risks
         WHERE organization_id = $1 GROUP BY category, severity ORDER BY category`,
        [req.orgId]
      ),
      pool.query(
        `SELECT m.name as model_name, m.risk_level,
           COUNT(r.id) as risk_count
         FROM ai_models m
         LEFT JOIN risks r ON r.model_id = m.id
         WHERE m.organization_id = $1
         GROUP BY m.id, m.name, m.risk_level`,
        [req.orgId]
      ),
      pool.query(
        `SELECT DATE_TRUNC('month', created_at) as month,
           COUNT(*) as new_risks
         FROM risks WHERE organization_id = $1
         AND created_at > NOW() - INTERVAL '12 months'
         GROUP BY month ORDER BY month`,
        [req.orgId]
      ),
    ]);

    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        risksByCategory: byCategory.rows,
        risksByModel: byModel.rows,
        monthlyTrends: trends.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate risk report" });
  }
});

// Vendor assessment report
router.get("/vendor-assessment", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.name, v.risk_level, v.dpdp_compliant, v.data_processing_location,
         v.status, v.last_assessment_date, COUNT(m.id) as model_count
       FROM vendors v
       LEFT JOIN ai_models m ON m.vendor_id = v.id
       WHERE v.organization_id = $1
       GROUP BY v.id ORDER BY v.risk_level DESC`,
      [req.orgId]
    );
    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        vendors: result.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate vendor report" });
  }
});

module.exports = router;

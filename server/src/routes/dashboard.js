const express = require("express");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Main dashboard data
router.get("/", async (req, res) => {
  try {
    const [
      modelStats,
      riskStats,
      incidentStats,
      complianceStats,
      vendorStats,
      recentActivity,
    ] = await Promise.all([
      // Model stats
      pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
           COUNT(CASE WHEN risk_level = 'unacceptable' THEN 1 END) as unacceptable,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active
         FROM ai_models WHERE organization_id = $1`,
        [req.orgId]
      ),
      // Risk stats
      pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
           COUNT(CASE WHEN severity = 'high' THEN 1 END) as high,
           COUNT(CASE WHEN status = 'identified' THEN 1 END) as open
         FROM risks WHERE organization_id = $1`,
        [req.orgId]
      ),
      // Incident stats
      pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'reported' THEN 1 END) as open,
           COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
           COUNT(CASE WHEN cert_in_reportable = true THEN 1 END) as cert_in_reportable
         FROM incidents WHERE organization_id = $1`,
        [req.orgId]
      ),
      // Compliance score
      pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'compliant' THEN 1 END) as compliant
         FROM compliance_requirements WHERE organization_id = $1`,
        [req.orgId]
      ),
      // Vendor stats
      pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN risk_level IN ('high', 'critical') THEN 1 END) as high_risk,
           COUNT(CASE WHEN dpdp_compliant = true THEN 1 END) as dpdp_compliant
         FROM vendors WHERE organization_id = $1`,
        [req.orgId]
      ),
      // Recent audit activity
      pool.query(
        `SELECT al.action, al.entity_type, al.created_at, u.name as user_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.organization_id = $1
         ORDER BY al.created_at DESC LIMIT 10`,
        [req.orgId]
      ),
    ]);

    const compTotal = parseInt(complianceStats.rows[0].total) || 1;
    const compCompliant = parseInt(complianceStats.rows[0].compliant);

    res.json({
      dashboard: {
        models: modelStats.rows[0],
        risks: riskStats.rows[0],
        incidents: incidentStats.rows[0],
        compliance: {
          ...complianceStats.rows[0],
          score: Math.round((compCompliant / compTotal) * 100),
        },
        vendors: vendorStats.rows[0],
        recentActivity: recentActivity.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

module.exports = router;

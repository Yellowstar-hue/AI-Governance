const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Get compliance overview per framework
router.get("/overview", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         f.id as framework_id, f.name as framework_name, f.short_code,
         COUNT(cr.id) as total_requirements,
         COUNT(CASE WHEN cr.status = 'compliant' THEN 1 END) as compliant,
         COUNT(CASE WHEN cr.status = 'partially_compliant' THEN 1 END) as partial,
         COUNT(CASE WHEN cr.status = 'non_compliant' THEN 1 END) as non_compliant,
         COUNT(CASE WHEN cr.status = 'not_assessed' THEN 1 END) as not_assessed
       FROM frameworks f
       LEFT JOIN compliance_requirements cr ON cr.framework_id = f.id AND cr.organization_id = $1
       WHERE f.is_active = true
       GROUP BY f.id, f.name, f.short_code
       ORDER BY f.name`,
      [req.orgId]
    );
    res.json({ frameworks: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch compliance overview" });
  }
});

// Get requirements for a framework
router.get("/frameworks/:frameworkId/requirements", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, f.name as framework_name
       FROM compliance_requirements cr
       JOIN frameworks f ON cr.framework_id = f.id
       WHERE cr.framework_id = $1 AND cr.organization_id = $2
       ORDER BY cr.section_number`,
      [req.params.frameworkId, req.orgId]
    );
    res.json({ requirements: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requirements" });
  }
});

// Update compliance requirement status
router.put(
  "/requirements/:id",
  [
    body("status").isIn(["compliant", "partially_compliant", "non_compliant", "not_assessed", "not_applicable"]),
    body("notes").optional().trim(),
    body("evidence_ids").optional().isArray(),
    body("assigned_to").optional().isInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const { status, notes, evidence_ids, assigned_to } = req.body;
      const result = await pool.query(
        `UPDATE compliance_requirements
         SET status = $1, notes = $2, evidence_ids = $3, assigned_to = $4,
             last_assessed = NOW(), updated_at = NOW()
         WHERE id = $5 AND organization_id = $6 RETURNING *`,
        [status, notes, JSON.stringify(evidence_ids || []), assigned_to,
         req.params.id, req.orgId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Requirement not found" });
      }
      res.json({ requirement: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to update requirement" });
    }
  }
);

// Get compliance score summary
router.get("/score", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'compliant' THEN 1 END) as compliant,
         COUNT(CASE WHEN status = 'partially_compliant' THEN 1 END) as partial,
         COUNT(CASE WHEN status = 'non_compliant' THEN 1 END) as non_compliant
       FROM compliance_requirements
       WHERE organization_id = $1`,
      [req.orgId]
    );

    const r = result.rows[0];
    const total = parseInt(r.total) || 1;
    const score = Math.round(
      ((parseInt(r.compliant) + parseInt(r.partial) * 0.5) / total) * 100
    );

    res.json({ score, details: r });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate compliance score" });
  }
});

module.exports = router;

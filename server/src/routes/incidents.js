const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List incidents
router.get("/", async (req, res) => {
  try {
    const { severity, status } = req.query;
    let query = `SELECT i.*, m.name as model_name, u.name as reporter_name
                 FROM incidents i
                 LEFT JOIN ai_models m ON i.model_id = m.id
                 LEFT JOIN users u ON i.reported_by = u.id
                 WHERE i.organization_id = $1`;
    const params = [req.orgId];
    let idx = 2;

    if (severity) { query += ` AND i.severity = $${idx++}`; params.push(severity); }
    if (status) { query += ` AND i.status = $${idx++}`; params.push(status); }

    query += " ORDER BY i.created_at DESC";
    const result = await pool.query(query, params);
    res.json({ incidents: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// Get incident
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, m.name as model_name
       FROM incidents i
       LEFT JOIN ai_models m ON i.model_id = m.id
       WHERE i.id = $1 AND i.organization_id = $2`,
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Incident not found" });
    }
    res.json({ incident: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

// Create incident
router.post(
  "/",
  [
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("severity").isIn(["critical", "high", "medium", "low"]),
    body("category").isIn([
      "bias_output", "data_breach", "model_failure", "privacy_violation",
      "safety_issue", "security_breach", "misinformation", "regulatory_violation", "other"
    ]),
    body("model_id").optional().isInt(),
    body("affected_users").optional().isInt(),
    body("cert_in_reportable").optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        title, description, severity, category, model_id,
        affected_users, cert_in_reportable,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO incidents (title, description, severity, category, model_id,
         affected_users, cert_in_reportable, status, reported_by, organization_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'reported',$8,$9) RETURNING *`,
        [title, description, severity, category, model_id,
         affected_users || 0, cert_in_reportable || false,
         req.user.id, req.orgId]
      );

      await logAuditEvent({
        userId: req.user.id,
        organizationId: req.orgId,
        action: "INCIDENT_REPORTED",
        entityType: "incident",
        entityId: result.rows[0].id,
        details: { title, severity, cert_in_reportable },
        ipAddress: req.ip,
      });

      res.status(201).json({ incident: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create incident" });
    }
  }
);

// Update incident
router.put("/:id", async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (["title", "description", "severity", "status", "category",
           "resolution", "root_cause", "corrective_actions",
           "cert_in_reported", "cert_in_report_date"].includes(key)) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No valid fields" });
    }

    setClauses.push("updated_at = NOW()");
    values.push(req.params.id, req.orgId);

    const result = await pool.query(
      `UPDATE incidents SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Incident not found" });
    }
    res.json({ incident: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update incident" });
  }
});

module.exports = router;

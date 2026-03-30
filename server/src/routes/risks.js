const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List risks
router.get("/", async (req, res) => {
  try {
    const { severity, status, model_id } = req.query;
    let query = `SELECT r.*, m.name as model_name FROM risks r
                 LEFT JOIN ai_models m ON r.model_id = m.id
                 WHERE r.organization_id = $1`;
    const params = [req.orgId];
    let idx = 2;

    if (severity) { query += ` AND r.severity = $${idx++}`; params.push(severity); }
    if (status) { query += ` AND r.status = $${idx++}`; params.push(status); }
    if (model_id) { query += ` AND r.model_id = $${idx++}`; params.push(model_id); }

    query += " ORDER BY r.created_at DESC";
    const result = await pool.query(query, params);
    res.json({ risks: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch risks" });
  }
});

// Get risk by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, m.name as model_name FROM risks r
       LEFT JOIN ai_models m ON r.model_id = m.id
       WHERE r.id = $1 AND r.organization_id = $2`,
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Risk not found" });
    }
    res.json({ risk: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch risk" });
  }
});

// Create risk
router.post(
  "/",
  [
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("severity").isIn(["critical", "high", "medium", "low"]),
    body("category").isIn([
      "bias_discrimination", "privacy_data", "security", "transparency",
      "accountability", "safety", "environmental", "regulatory", "operational", "other"
    ]),
    body("model_id").optional().isInt(),
    body("mitigation_plan").optional().trim(),
    body("owner_id").optional().isInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, severity, category, model_id, mitigation_plan, owner_id } = req.body;
      const result = await pool.query(
        `INSERT INTO risks (title, description, severity, category, model_id,
         mitigation_plan, owner_id, status, organization_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'identified',$8,$9) RETURNING *`,
        [title, description, severity, category, model_id,
         mitigation_plan, owner_id, req.orgId, req.user.id]
      );

      await logAuditEvent({
        userId: req.user.id,
        organizationId: req.orgId,
        action: "RISK_CREATED",
        entityType: "risk",
        entityId: result.rows[0].id,
        details: { title, severity },
        ipAddress: req.ip,
      });

      res.status(201).json({ risk: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create risk" });
    }
  }
);

// Update risk
router.put("/:id", async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (["title", "description", "severity", "category", "status",
           "mitigation_plan", "owner_id", "resolution_notes"].includes(key)) {
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
      `UPDATE risks SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Risk not found" });
    }
    res.json({ risk: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update risk" });
  }
});

module.exports = router;

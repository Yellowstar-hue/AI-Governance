const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List data processing activities (DPDP compliance - ROPA equivalent)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dpa.*, m.name as model_name FROM data_processing_activities dpa
       LEFT JOIN ai_models m ON dpa.model_id = m.id
       WHERE dpa.organization_id = $1 ORDER BY dpa.created_at DESC`,
      [req.orgId]
    );
    res.json({ activities: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Get single activity
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM data_processing_activities WHERE id = $1 AND organization_id = $2",
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Activity not found" });
    res.json({ activity: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// Create data processing activity
router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("purpose").trim().notEmpty(),
    body("legal_basis").isIn(["consent", "contract", "legal_obligation", "vital_interest", "public_interest", "legitimate_interest"]),
    body("data_categories").isArray(),
    body("data_subjects").isArray(),
    body("retention_period").trim().notEmpty(),
    body("cross_border_transfer").isBoolean(),
    body("model_id").optional().isInt(),
    body("dpia_required").optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        name, purpose, legal_basis, data_categories, data_subjects,
        retention_period, cross_border_transfer, transfer_destinations,
        security_measures, model_id, dpia_required,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO data_processing_activities
         (organization_id, name, purpose, legal_basis, data_categories, data_subjects,
          retention_period, cross_border_transfer, transfer_destinations,
          security_measures, model_id, dpia_required, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          req.orgId, name, purpose, legal_basis,
          JSON.stringify(data_categories), JSON.stringify(data_subjects),
          retention_period, cross_border_transfer,
          JSON.stringify(transfer_destinations || []),
          security_measures, model_id, dpia_required || false, req.user.id,
        ]
      );

      await logAuditEvent({
        userId: req.user.id,
        organizationId: req.orgId,
        action: "DPA_CREATED",
        entityType: "data_processing_activity",
        entityId: result.rows[0].id,
        details: { name, legal_basis },
        ipAddress: req.ip,
      });

      res.status(201).json({ activity: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create activity" });
    }
  }
);

// Update activity
router.put("/:id", async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      if ([
        "name", "purpose", "legal_basis", "data_categories", "data_subjects",
        "retention_period", "cross_border_transfer", "transfer_destinations",
        "security_measures", "status", "dpia_required", "dpia_completed",
      ].includes(key)) {
        const val = Array.isArray(value) ? JSON.stringify(value) : value;
        setClauses.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) return res.status(400).json({ error: "No valid fields" });

    setClauses.push("updated_at = NOW()");
    values.push(req.params.id, req.orgId);

    const result = await pool.query(
      `UPDATE data_processing_activities SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Activity not found" });
    res.json({ activity: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update activity" });
  }
});

module.exports = router;

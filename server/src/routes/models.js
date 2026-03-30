const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List AI models
router.get("/", async (req, res) => {
  try {
    const { status, risk_level, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM ai_models WHERE organization_id = $1";
    const params = [req.orgId];
    let idx = 2;

    if (status) {
      query += ` AND status = $${idx++}`;
      params.push(status);
    }
    if (risk_level) {
      query += ` AND risk_level = $${idx++}`;
      params.push(risk_level);
    }

    query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM ai_models WHERE organization_id = $1",
      [req.orgId]
    );

    res.json({
      models: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// Get single model
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ai_models WHERE id = $1 AND organization_id = $2",
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Model not found" });
    }
    res.json({ model: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch model" });
  }
});

// Create AI model
router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("description").optional().trim(),
    body("model_type").isIn(["classification", "regression", "nlp", "computer_vision", "generative", "recommendation", "other"]),
    body("risk_level").isIn(["minimal", "limited", "high", "unacceptable"]),
    body("purpose").trim().notEmpty(),
    body("vendor_id").optional().isInt(),
    body("data_sources").optional().trim(),
    body("deployment_env").optional().isIn(["production", "staging", "development", "retired"]),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        name, description, model_type, risk_level, purpose,
        vendor_id, data_sources, deployment_env,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO ai_models (name, description, model_type, risk_level, purpose,
         vendor_id, data_sources, deployment_env, status, organization_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10) RETURNING *`,
        [name, description, model_type, risk_level, purpose,
         vendor_id, data_sources, deployment_env, req.orgId, req.user.id]
      );

      await logAuditEvent({
        userId: req.user.id,
        organizationId: req.orgId,
        action: "MODEL_CREATED",
        entityType: "ai_model",
        entityId: result.rows[0].id,
        details: { name, risk_level },
        ipAddress: req.ip,
      });

      res.status(201).json({ model: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create model" });
    }
  }
);

// Update model
router.put("/:id", async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (["name", "description", "model_type", "risk_level", "purpose",
           "status", "data_sources", "deployment_env"].includes(key)) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(req.params.id, req.orgId);

    const result = await pool.query(
      `UPDATE ai_models SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Model not found" });
    }
    res.json({ model: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update model" });
  }
});

// Delete model
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM ai_models WHERE id = $1 AND organization_id = $2 RETURNING id",
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Model not found" });
    }

    await logAuditEvent({
      userId: req.user.id,
      organizationId: req.orgId,
      action: "MODEL_DELETED",
      entityType: "ai_model",
      entityId: req.params.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Model deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete model" });
  }
});

module.exports = router;

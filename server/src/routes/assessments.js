const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAuditEvent } = require("../services/audit");
const { createNotification, NotificationType } = require("../services/notifications");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List assessment templates
router.get("/templates", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM assessment_templates WHERE is_active = true ORDER BY name"
    );
    res.json({ templates: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// List assessments
router.get("/", async (req, res) => {
  try {
    const { status, model_id, vendor_id } = req.query;
    let query = `SELECT a.*, at.name as template_name, at.type as assessment_type,
                   m.name as model_name, v.name as vendor_name,
                   u1.name as assignee_name, u2.name as creator_name
                 FROM assessments a
                 LEFT JOIN assessment_templates at ON a.template_id = at.id
                 LEFT JOIN ai_models m ON a.model_id = m.id
                 LEFT JOIN vendors v ON a.vendor_id = v.id
                 LEFT JOIN users u1 ON a.assigned_to = u1.id
                 LEFT JOIN users u2 ON a.created_by = u2.id
                 WHERE a.organization_id = $1`;
    const params = [req.orgId];
    let idx = 2;

    if (status) { query += ` AND a.status = $${idx++}`; params.push(status); }
    if (model_id) { query += ` AND a.model_id = $${idx++}`; params.push(model_id); }
    if (vendor_id) { query += ` AND a.vendor_id = $${idx++}`; params.push(vendor_id); }

    query += " ORDER BY a.created_at DESC";
    const result = await pool.query(query, params);
    res.json({ assessments: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
});

// Get single assessment
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, at.name as template_name, at.questions, at.scoring_method
       FROM assessments a
       LEFT JOIN assessment_templates at ON a.template_id = at.id
       WHERE a.id = $1 AND a.organization_id = $2`,
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Assessment not found" });
    res.json({ assessment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assessment" });
  }
});

// Create assessment
router.post(
  "/",
  [
    body("template_id").isInt(),
    body("title").trim().notEmpty(),
    body("model_id").optional().isInt(),
    body("vendor_id").optional().isInt(),
    body("assigned_to").optional().isInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const { template_id, title, model_id, vendor_id, assigned_to } = req.body;
      const result = await pool.query(
        `INSERT INTO assessments (template_id, organization_id, model_id, vendor_id,
         title, assigned_to, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [template_id, req.orgId, model_id, vendor_id, title, assigned_to, req.user.id]
      );

      if (assigned_to) {
        await createNotification({
          userId: assigned_to,
          organizationId: req.orgId,
          type: NotificationType.ASSESSMENT_ASSIGNED,
          title: "Assessment Assigned",
          message: `You have been assigned the assessment: ${title}`,
          link: `/assessments/${result.rows[0].id}`,
        });
      }

      res.status(201).json({ assessment: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create assessment" });
    }
  }
);

// Submit assessment responses
router.put("/:id/responses", async (req, res) => {
  try {
    const { responses } = req.body;
    const result = await pool.query(
      `UPDATE assessments SET responses = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [JSON.stringify(responses), req.params.id, req.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Assessment not found" });
    res.json({ assessment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to save responses" });
  }
});

// Complete assessment with scoring
router.post("/:id/complete", async (req, res) => {
  try {
    const assessment = await pool.query(
      `SELECT a.*, at.questions, at.scoring_method FROM assessments a
       JOIN assessment_templates at ON a.template_id = at.id
       WHERE a.id = $1 AND a.organization_id = $2`,
      [req.params.id, req.orgId]
    );

    if (assessment.rows.length === 0) return res.status(404).json({ error: "Assessment not found" });

    const a = assessment.rows[0];
    const questions = a.questions || [];
    const responses = a.responses || {};
    let totalScore = 0;
    let maxScore = 0;

    for (const q of questions) {
      const response = responses[q.id];
      if (response && q.maxScore) {
        totalScore += parseInt(response.score || 0);
        maxScore += q.maxScore;
      }
    }

    const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    let riskRating = "low";
    if (score < 40) riskRating = "critical";
    else if (score < 60) riskRating = "high";
    else if (score < 80) riskRating = "medium";

    const result = await pool.query(
      `UPDATE assessments SET status = 'completed', score = $1, risk_rating = $2,
       completed_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND organization_id = $4 RETURNING *`,
      [score, riskRating, req.params.id, req.orgId]
    );

    await logAuditEvent({
      userId: req.user.id,
      organizationId: req.orgId,
      action: "ASSESSMENT_COMPLETED",
      entityType: "assessment",
      entityId: req.params.id,
      details: { score, riskRating },
      ipAddress: req.ip,
    });

    res.json({ assessment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete assessment" });
  }
});

module.exports = router;

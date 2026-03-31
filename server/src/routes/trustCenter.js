const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, authorize, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// Public: View trust center by slug
router.get("/public/:slug", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.*, o.name as organization_name, o.industry, o.website
       FROM trust_center tc
       JOIN organizations o ON tc.organization_id = o.id
       WHERE tc.public_slug = $1 AND tc.is_enabled = true`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trust center not found" });
    }

    const tc = result.rows[0];

    // Get published compliance scores
    let complianceData = [];
    if (tc.published_frameworks && tc.published_frameworks.length > 0) {
      const fwIds = tc.published_frameworks;
      complianceData = (
        await pool.query(
          `SELECT f.name, f.short_code,
             COUNT(cr.id) as total,
             COUNT(CASE WHEN cr.status = 'compliant' THEN 1 END) as compliant
           FROM frameworks f
           LEFT JOIN compliance_requirements cr ON cr.framework_id = f.id AND cr.organization_id = $1
           WHERE f.id = ANY($2)
           GROUP BY f.id, f.name, f.short_code`,
          [tc.organization_id, fwIds]
        )
      ).rows;
    }

    // Get published policies
    let policies = [];
    if (tc.published_policies && tc.published_policies.length > 0) {
      policies = (
        await pool.query(
          "SELECT id, title, category, version, updated_at FROM policies WHERE id = ANY($1) AND status = 'approved'",
          [tc.published_policies]
        )
      ).rows;
    }

    // Get model count and risk breakdown (anonymized)
    const modelStats = await pool.query(
      `SELECT risk_level, COUNT(*) as count FROM ai_models
       WHERE organization_id = $1 AND status = 'active'
       GROUP BY risk_level`,
      [tc.organization_id]
    );

    res.json({
      trustCenter: {
        organizationName: tc.organization_name,
        industry: tc.industry,
        website: tc.website,
        description: tc.company_description,
        aiCommitment: tc.ai_commitment,
        dpoName: tc.dpo_name,
        dpoEmail: tc.dpo_email,
        grievanceOfficerName: tc.grievance_officer_name,
        grievanceOfficerEmail: tc.grievance_officer_email,
        customSections: tc.custom_sections,
        themeColor: tc.theme_color,
        logoUrl: tc.logo_url,
        lastUpdated: tc.last_updated,
      },
      compliance: complianceData,
      policies,
      modelStats: modelStats.rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trust center" });
  }
});

// Protected: Manage trust center
router.use(authenticate, tenantIsolation);

// Get own trust center config
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trust_center WHERE organization_id = $1",
      [req.orgId]
    );
    res.json({ trustCenter: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trust center" });
  }
});

// Create or update trust center
router.put(
  "/",
  authorize("admin"),
  [
    body("is_enabled").optional().isBoolean(),
    body("public_slug").optional().trim(),
    body("company_description").optional().trim(),
    body("ai_commitment").optional().trim(),
    body("dpo_name").optional().trim(),
    body("dpo_email").optional().isEmail(),
    body("grievance_officer_name").optional().trim(),
    body("grievance_officer_email").optional().isEmail(),
  ],
  validate,
  async (req, res) => {
    try {
      const fields = req.body;

      const existing = await pool.query(
        "SELECT id FROM trust_center WHERE organization_id = $1",
        [req.orgId]
      );

      let result;
      if (existing.rows.length > 0) {
        const setClauses = [];
        const values = [];
        let idx = 1;

        for (const [key, value] of Object.entries(fields)) {
          if ([
            "is_enabled", "public_slug", "company_description", "ai_commitment",
            "dpo_name", "dpo_email", "grievance_officer_name", "grievance_officer_email",
            "published_policies", "published_frameworks", "custom_sections", "theme_color", "logo_url",
          ].includes(key)) {
            const val = Array.isArray(value) ? JSON.stringify(value) : value;
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
          }
        }

        if (setClauses.length === 0) return res.status(400).json({ error: "No fields to update" });

        setClauses.push("last_updated = NOW()");
        values.push(req.orgId);

        result = await pool.query(
          `UPDATE trust_center SET ${setClauses.join(", ")}
           WHERE organization_id = $${idx} RETURNING *`,
          values
        );
      } else {
        result = await pool.query(
          `INSERT INTO trust_center (organization_id, public_slug, is_enabled, company_description, ai_commitment,
           dpo_name, dpo_email, grievance_officer_name, grievance_officer_email)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            req.orgId,
            fields.public_slug || `org-${req.orgId}`,
            fields.is_enabled || false,
            fields.company_description,
            fields.ai_commitment,
            fields.dpo_name,
            fields.dpo_email,
            fields.grievance_officer_name,
            fields.grievance_officer_email,
          ]
        );
      }

      res.json({ trustCenter: result.rows[0] });
    } catch (err) {
      if (err.code === "23505") return res.status(409).json({ error: "Public slug already taken" });
      res.status(500).json({ error: "Failed to update trust center" });
    }
  }
);

module.exports = router;

const express = require("express");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List policy templates
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM policy_templates WHERE is_active = true ORDER BY category, title"
    );
    res.json({ templates: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Get template
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM policy_templates WHERE id = $1 AND is_active = true",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Template not found" });
    res.json({ template: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// Create policy from template
router.post("/:id/use", async (req, res) => {
  try {
    const template = await pool.query(
      "SELECT * FROM policy_templates WHERE id = $1",
      [req.params.id]
    );
    if (template.rows.length === 0) return res.status(404).json({ error: "Template not found" });

    const t = template.rows[0];
    const orgName = (await pool.query("SELECT name FROM organizations WHERE id = $1", [req.orgId])).rows[0]?.name || "Organization";

    // Replace placeholders in template content
    const content = t.content
      .replace(/\{ORGANIZATION_NAME\}/g, orgName)
      .replace(/\{DATE\}/g, new Date().toLocaleDateString("en-IN"))
      .replace(/\{YEAR\}/g, new Date().getFullYear().toString());

    const result = await pool.query(
      `INSERT INTO policies (title, content, category, version, applicable_frameworks,
       status, organization_id, created_by)
       VALUES ($1, $2, $3, '1.0', $4, 'draft', $5, $6) RETURNING *`,
      [t.title, content, t.category, t.applicable_frameworks, req.orgId, req.user.id]
    );

    res.status(201).json({ policy: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to create policy from template" });
  }
});

module.exports = router;

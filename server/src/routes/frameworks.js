const express = require("express");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List all available frameworks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM frameworks WHERE is_active = true ORDER BY name"
    );
    res.json({ frameworks: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch frameworks" });
  }
});

// Get framework details with requirements
router.get("/:id", async (req, res) => {
  try {
    const [framework, requirements] = await Promise.all([
      pool.query("SELECT * FROM frameworks WHERE id = $1", [req.params.id]),
      pool.query(
        `SELECT * FROM compliance_requirements
         WHERE framework_id = $1 AND organization_id = $2
         ORDER BY section_number`,
        [req.params.id, req.orgId]
      ),
    ]);

    if (framework.rows.length === 0) {
      return res.status(404).json({ error: "Framework not found" });
    }

    res.json({
      framework: framework.rows[0],
      requirements: requirements.rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch framework" });
  }
});

// Initialize framework for organization (copies template requirements)
router.post("/:id/initialize", async (req, res) => {
  try {
    const existing = await pool.query(
      "SELECT id FROM compliance_requirements WHERE framework_id = $1 AND organization_id = $2 LIMIT 1",
      [req.params.id, req.orgId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Framework already initialized" });
    }

    // Copy template requirements
    await pool.query(
      `INSERT INTO compliance_requirements
       (framework_id, organization_id, section_number, title, description, status)
       SELECT framework_id, $2, section_number, title, description, 'not_assessed'
       FROM framework_requirements_template
       WHERE framework_id = $1`,
      [req.params.id, req.orgId]
    );

    const result = await pool.query(
      "SELECT * FROM compliance_requirements WHERE framework_id = $1 AND organization_id = $2 ORDER BY section_number",
      [req.params.id, req.orgId]
    );

    res.status(201).json({ requirements: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize framework" });
  }
});

module.exports = router;

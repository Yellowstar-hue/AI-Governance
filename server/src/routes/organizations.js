const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, authorize, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Get organization details
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM organizations WHERE id = $1",
      [req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }
    res.json({ organization: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch organization" });
  }
});

// Update organization
router.put(
  "/",
  authorize("admin"),
  [
    body("name").optional().trim().notEmpty(),
    body("industry").optional().trim(),
    body("size").optional().isIn(["startup", "small", "medium", "large", "enterprise"]),
    body("website").optional().isURL(),
    body("gstin").optional().trim(),
    body("cin").optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, industry, size, website, gstin, cin } = req.body;
      const result = await pool.query(
        `UPDATE organizations
         SET name = COALESCE($1, name),
             industry = COALESCE($2, industry),
             size = COALESCE($3, size),
             website = COALESCE($4, website),
             gstin = COALESCE($5, gstin),
             cin = COALESCE($6, cin),
             updated_at = NOW()
         WHERE id = $7 RETURNING *`,
        [name, industry, size, website, gstin, cin, req.orgId]
      );
      res.json({ organization: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to update organization" });
    }
  }
);

// Get organization stats
router.get("/stats", async (req, res) => {
  try {
    const [models, risks, incidents, vendors] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM ai_models WHERE organization_id = $1", [req.orgId]),
      pool.query("SELECT COUNT(*) FROM risks WHERE organization_id = $1", [req.orgId]),
      pool.query("SELECT COUNT(*) FROM incidents WHERE organization_id = $1", [req.orgId]),
      pool.query("SELECT COUNT(*) FROM vendors WHERE organization_id = $1", [req.orgId]),
    ]);
    res.json({
      stats: {
        totalModels: parseInt(models.rows[0].count),
        totalRisks: parseInt(risks.rows[0].count),
        totalIncidents: parseInt(incidents.rows[0].count),
        totalVendors: parseInt(vendors.rows[0].count),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;

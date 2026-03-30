const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List vendors
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, COUNT(m.id) as model_count
       FROM vendors v
       LEFT JOIN ai_models m ON m.vendor_id = v.id
       WHERE v.organization_id = $1
       GROUP BY v.id ORDER BY v.name`,
      [req.orgId]
    );
    res.json({ vendors: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// Get vendor by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vendors WHERE id = $1 AND organization_id = $2",
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ vendor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// Create vendor
router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("contact_email").optional().isEmail(),
    body("risk_level").isIn(["low", "medium", "high", "critical"]),
    body("country").optional().trim(),
    body("services_provided").optional().trim(),
    body("data_processing_location").optional().isIn(["india", "international", "both"]),
    body("dpdp_compliant").optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        name, contact_email, risk_level, country,
        services_provided, data_processing_location, dpdp_compliant,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO vendors (name, contact_email, risk_level, country,
         services_provided, data_processing_location, dpdp_compliant,
         status, organization_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9) RETURNING *`,
        [name, contact_email, risk_level, country,
         services_provided, data_processing_location, dpdp_compliant || false,
         req.orgId, req.user.id]
      );

      await logAuditEvent({
        userId: req.user.id,
        organizationId: req.orgId,
        action: "VENDOR_CREATED",
        entityType: "vendor",
        entityId: result.rows[0].id,
        details: { name, risk_level },
        ipAddress: req.ip,
      });

      res.status(201).json({ vendor: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create vendor" });
    }
  }
);

// Update vendor
router.put("/:id", async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (["name", "contact_email", "risk_level", "country", "status",
           "services_provided", "data_processing_location", "dpdp_compliant",
           "assessment_notes", "last_assessment_date"].includes(key)) {
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
      `UPDATE vendors SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ vendor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

module.exports = router;

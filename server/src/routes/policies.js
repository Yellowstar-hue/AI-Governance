const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, authorize, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List policies
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as author_name
       FROM policies p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.organization_id = $1
       ORDER BY p.created_at DESC`,
      [req.orgId]
    );
    res.json({ policies: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch policies" });
  }
});

// Get policy
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM policies WHERE id = $1 AND organization_id = $2",
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.json({ policy: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch policy" });
  }
});

// Create policy
router.post(
  "/",
  authorize("admin", "manager"),
  [
    body("title").trim().notEmpty(),
    body("content").trim().notEmpty(),
    body("category").isIn([
      "ai_usage", "data_protection", "model_governance", "vendor_management",
      "incident_response", "ethics", "transparency", "risk_management", "other"
    ]),
    body("version").optional().trim(),
    body("applicable_frameworks").optional().isArray(),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, content, category, version, applicable_frameworks } = req.body;
      const result = await pool.query(
        `INSERT INTO policies (title, content, category, version,
         applicable_frameworks, status, organization_id, created_by)
         VALUES ($1,$2,$3,$4,$5,'draft',$6,$7) RETURNING *`,
        [title, content, category, version || "1.0",
         JSON.stringify(applicable_frameworks || []), req.orgId, req.user.id]
      );
      res.status(201).json({ policy: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create policy" });
    }
  }
);

// Update policy
router.put("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (["title", "content", "category", "version", "status",
           "applicable_frameworks", "approved_by"].includes(key)) {
        const val = Array.isArray(value) ? JSON.stringify(value) : value;
        setClauses.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No valid fields" });
    }

    setClauses.push("updated_at = NOW()");
    values.push(req.params.id, req.orgId);

    const result = await pool.query(
      `UPDATE policies SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.json({ policy: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update policy" });
  }
});

module.exports = router;

const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List evidence
router.get("/", async (req, res) => {
  try {
    const { folder, framework_id } = req.query;
    let query = `SELECT e.*, u.name as uploaded_by_name
                 FROM evidence e
                 LEFT JOIN users u ON e.uploaded_by = u.id
                 WHERE e.organization_id = $1`;
    const params = [req.orgId];
    let idx = 2;

    if (folder) { query += ` AND e.folder = $${idx++}`; params.push(folder); }
    if (framework_id) { query += ` AND e.framework_id = $${idx++}`; params.push(framework_id); }

    query += " ORDER BY e.created_at DESC";
    const result = await pool.query(query, params);
    res.json({ evidence: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
});

// Create evidence record
router.post(
  "/",
  [
    body("title").trim().notEmpty(),
    body("description").optional().trim(),
    body("type").isIn(["document", "screenshot", "log", "certificate", "policy", "report", "other"]),
    body("folder").optional().trim(),
    body("framework_id").optional().isInt(),
    body("requirement_id").optional().isInt(),
    body("url").optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, type, folder, framework_id, requirement_id, url } = req.body;
      const result = await pool.query(
        `INSERT INTO evidence (title, description, type, folder, framework_id,
         requirement_id, url, uploaded_by, organization_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [title, description, type, folder || "General",
         framework_id, requirement_id, url, req.user.id, req.orgId]
      );
      res.status(201).json({ evidence: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create evidence" });
    }
  }
);

// Delete evidence
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM evidence WHERE id = $1 AND organization_id = $2 RETURNING id",
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evidence not found" });
    }
    res.json({ message: "Evidence deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete evidence" });
  }
});

module.exports = router;

const express = require("express");
const { pool } = require("../config/database");
const { authenticate, authorize, tenantIsolation } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Get audit logs
router.get("/logs", async (req, res) => {
  try {
    const { entity_type, action, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT al.*, u.name as user_name, u.email as user_email
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE al.organization_id = $1`;
    const params = [req.orgId];
    let idx = 2;

    if (entity_type) { query += ` AND al.entity_type = $${idx++}`; params.push(entity_type); }
    if (action) { query += ` AND al.action = $${idx++}`; params.push(action); }

    query += ` ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Get entity history
router.get("/entity/:type/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.organization_id = $1 AND al.entity_type = $2 AND al.entity_id = $3
       ORDER BY al.created_at DESC`,
      [req.orgId, req.params.type, req.params.id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entity history" });
  }
});

module.exports = router;

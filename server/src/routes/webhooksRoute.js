const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, authorize, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List webhooks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM webhooks WHERE organization_id = $1 ORDER BY created_at DESC",
      [req.orgId]
    );
    res.json({ webhooks: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

// Create webhook
router.post(
  "/",
  authorize("admin"),
  [
    body("name").trim().notEmpty(),
    body("url").isURL(),
    body("events").isArray({ min: 1 }),
    body("secret").optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, url, events, secret } = req.body;
      const result = await pool.query(
        `INSERT INTO webhooks (organization_id, name, url, secret, events, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.orgId, name, url, secret, JSON.stringify(events), req.user.id]
      );
      res.status(201).json({ webhook: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to create webhook" });
    }
  }
);

// Update webhook
router.put("/:id", authorize("admin"), async (req, res) => {
  try {
    const { name, url, events, secret, is_active } = req.body;
    const result = await pool.query(
      `UPDATE webhooks SET
         name = COALESCE($1, name), url = COALESCE($2, url),
         events = COALESCE($3, events), secret = COALESCE($4, secret),
         is_active = COALESCE($5, is_active), updated_at = NOW()
       WHERE id = $6 AND organization_id = $7 RETURNING *`,
      [name, url, events ? JSON.stringify(events) : null, secret, is_active, req.params.id, req.orgId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Webhook not found" });
    res.json({ webhook: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update webhook" });
  }
});

// Delete webhook
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM webhooks WHERE id = $1 AND organization_id = $2", [req.params.id, req.orgId]);
    res.json({ message: "Webhook deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// Get delivery history
router.get("/:id/deliveries", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wd.* FROM webhook_deliveries wd
       JOIN webhooks w ON wd.webhook_id = w.id
       WHERE w.id = $1 AND w.organization_id = $2
       ORDER BY wd.delivered_at DESC LIMIT 50`,
      [req.params.id, req.orgId]
    );
    res.json({ deliveries: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

module.exports = router;

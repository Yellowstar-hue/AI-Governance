const express = require("express");
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, authorize, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// List users in organization
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, is_active, created_at
       FROM users WHERE organization_id = $1 ORDER BY created_at DESC`,
      [req.orgId]
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Invite user
router.post(
  "/invite",
  authorize("admin"),
  [
    body("email").isEmail().normalizeEmail(),
    body("name").trim().notEmpty(),
    body("role").isIn(["admin", "manager", "analyst", "viewer"]),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, name, role } = req.body;
      const tempPassword = await bcrypt.hash("changeme123", 12);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, organization_id, is_active)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING id, email, name, role`,
        [email, tempPassword, name, role, req.orgId]
      );

      await logAuditEvent({
        userId: req.user.id,
        organizationId: req.orgId,
        action: "USER_INVITED",
        entityType: "user",
        entityId: result.rows[0].id,
        details: { email, role },
        ipAddress: req.ip,
      });

      res.status(201).json({ user: result.rows[0] });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Failed to invite user" });
    }
  }
);

// Update user role
router.put(
  "/:id/role",
  authorize("admin"),
  [body("role").isIn(["admin", "manager", "analyst", "viewer"])],
  validate,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE users SET role = $1, updated_at = NOW()
         WHERE id = $2 AND organization_id = $3 RETURNING id, email, name, role`,
        [req.body.role, req.params.id, req.orgId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// Deactivate user
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    await pool.query(
      "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND organization_id = $2",
      [req.params.id, req.orgId]
    );
    res.json({ message: "User deactivated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to deactivate user" });
  }
});

module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("name").trim().notEmpty(),
    body("organizationName").trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, name, organizationName } = req.body;

      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Create organization (tenant)
      const orgResult = await pool.query(
        `INSERT INTO organizations (name, plan, status) VALUES ($1, 'trial', 'active') RETURNING id`,
        [organizationName]
      );
      const orgId = orgResult.rows[0].id;

      // Create user as org admin
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, organization_id, is_active)
         VALUES ($1, $2, $3, 'admin', $4, true) RETURNING id, email, name, role`,
        [email, hashedPassword, name, orgId]
      );

      const user = userResult.rows[0];
      const token = jwt.sign(
        { userId: user.id, orgId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      await logAuditEvent({
        userId: user.id,
        organizationId: orgId,
        action: "USER_REGISTERED",
        entityType: "user",
        entityId: user.id,
        ipAddress: req.ip,
      });

      res.status(201).json({ user, token, organizationId: orgId });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({
        error: process.env.NODE_ENV === "production"
          ? "Registration failed - database may not be ready yet. Please try again in 30 seconds."
          : err.message,
      });
    }
  }
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        "SELECT id, email, name, role, password_hash, organization_id FROM users WHERE email = $1 AND is_active = true",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, orgId: user.organization_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      await logAuditEvent({
        userId: user.id,
        organizationId: user.organization_id,
        action: "USER_LOGIN",
        entityType: "user",
        entityId: user.id,
        ipAddress: req.ip,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
        organizationId: user.organization_id,
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// Get current user
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Change password
router.put(
  "/password",
  authenticate,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [req.user.id]
      );

      const valid = await bcrypt.compare(
        currentPassword,
        result.rows[0].password_hash
      );
      if (!valid) {
        return res.status(401).json({ error: "Current password incorrect" });
      }

      const hash = await bcrypt.hash(newPassword, 12);
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        hash,
        req.user.id,
      ]);

      res.json({ message: "Password updated" });
    } catch (err) {
      res.status(500).json({ error: "Password update failed" });
    }
  }
);

module.exports = router;

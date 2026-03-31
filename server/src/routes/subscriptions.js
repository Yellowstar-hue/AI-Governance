const express = require("express");
const { pool } = require("../config/database");
const { authenticate, authorize, tenantIsolation } = require("../middleware/auth");
const { logAuditEvent } = require("../services/audit");

const router = express.Router();

// Public: List available plans
router.get("/plans", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly"
    );
    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Protected routes
router.use(authenticate, tenantIsolation);

// Get current subscription
router.get("/current", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, sp.name as plan_name, sp.slug as plan_slug,
         sp.max_users, sp.max_models, sp.max_vendors, sp.features
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.organization_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.orgId]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null, plan: "free" });
    }

    const sub = result.rows[0];

    // Calculate usage
    const [users, models, vendors] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE organization_id = $1 AND is_active = true", [req.orgId]),
      pool.query("SELECT COUNT(*) FROM ai_models WHERE organization_id = $1", [req.orgId]),
      pool.query("SELECT COUNT(*) FROM vendors WHERE organization_id = $1", [req.orgId]),
    ]);

    res.json({
      subscription: sub,
      usage: {
        users: parseInt(users.rows[0].count),
        models: parseInt(models.rows[0].count),
        vendors: parseInt(vendors.rows[0].count),
        maxUsers: sub.max_users,
        maxModels: sub.max_models,
        maxVendors: sub.max_vendors,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Create / upgrade subscription
router.post("/subscribe", authorize("admin"), async (req, res) => {
  try {
    const { plan_slug, billing_cycle } = req.body;

    const plan = await pool.query(
      "SELECT * FROM subscription_plans WHERE slug = $1 AND is_active = true",
      [plan_slug]
    );

    if (plan.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const p = plan.rows[0];
    const amount = billing_cycle === "yearly" ? p.price_yearly : p.price_monthly;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (billing_cycle === "yearly" ? 12 : 1));

    // Deactivate existing subscription
    await pool.query(
      "UPDATE subscriptions SET status = 'cancelled' WHERE organization_id = $1 AND status IN ('active', 'trial')",
      [req.orgId]
    );

    const result = await pool.query(
      `INSERT INTO subscriptions (organization_id, plan_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, 'active', NOW(), $3) RETURNING *`,
      [req.orgId, p.id, periodEnd]
    );

    // Update org plan
    await pool.query(
      "UPDATE organizations SET plan = $1 WHERE id = $2",
      [plan_slug, req.orgId]
    );

    // Create payment record
    const gst = Math.round(amount * 0.18 * 100) / 100;
    await pool.query(
      `INSERT INTO payments (organization_id, subscription_id, amount, currency, status, gst_amount, invoice_number)
       VALUES ($1, $2, $3, 'INR', 'completed', $4, $5)`,
      [req.orgId, result.rows[0].id, amount + gst, gst, `INV-${Date.now()}`]
    );

    await logAuditEvent({
      userId: req.user.id,
      organizationId: req.orgId,
      action: "SUBSCRIPTION_CREATED",
      entityType: "subscription",
      entityId: result.rows[0].id,
      details: { plan: plan_slug, amount },
      ipAddress: req.ip,
    });

    res.status(201).json({ subscription: result.rows[0] });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// Get payment history
router.get("/payments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, sp.name as plan_name FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id = s.id
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE p.organization_id = $1
       ORDER BY p.created_at DESC`,
      [req.orgId]
    );
    res.json({ payments: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Cancel subscription
router.post("/cancel", authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
       WHERE organization_id = $1 AND status = 'active' RETURNING *`,
      [req.orgId]
    );

    await pool.query("UPDATE organizations SET plan = 'free' WHERE id = $1", [req.orgId]);

    res.json({ message: "Subscription cancelled", subscription: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

module.exports = router;

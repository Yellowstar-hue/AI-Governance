const express = require("express");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Global search across all entities
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters" });
    }

    const searchTerm = `%${q}%`;

    const [models, risks, incidents, vendors, policies] = await Promise.all([
      pool.query(
        `SELECT id, name, model_type as subtitle, 'model' as type FROM ai_models
         WHERE organization_id = $1 AND (name ILIKE $2 OR description ILIKE $2 OR purpose ILIKE $2)
         LIMIT 5`,
        [req.orgId, searchTerm]
      ),
      pool.query(
        `SELECT id, title as name, severity as subtitle, 'risk' as type FROM risks
         WHERE organization_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
         LIMIT 5`,
        [req.orgId, searchTerm]
      ),
      pool.query(
        `SELECT id, title as name, severity as subtitle, 'incident' as type FROM incidents
         WHERE organization_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
         LIMIT 5`,
        [req.orgId, searchTerm]
      ),
      pool.query(
        `SELECT id, name, risk_level as subtitle, 'vendor' as type FROM vendors
         WHERE organization_id = $1 AND (name ILIKE $2 OR services_provided ILIKE $2)
         LIMIT 5`,
        [req.orgId, searchTerm]
      ),
      pool.query(
        `SELECT id, title as name, category as subtitle, 'policy' as type FROM policies
         WHERE organization_id = $1 AND (title ILIKE $2 OR content ILIKE $2)
         LIMIT 5`,
        [req.orgId, searchTerm]
      ),
    ]);

    const results = [
      ...models.rows,
      ...risks.rows,
      ...incidents.rows,
      ...vendors.rows,
      ...policies.rows,
    ];

    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;

const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Get comments for entity
router.get("/:entityType/:entityId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.organization_id = $1 AND c.entity_type = $2 AND c.entity_id = $3
       ORDER BY c.created_at ASC`,
      [req.orgId, req.params.entityType, req.params.entityId]
    );
    res.json({ comments: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add comment
router.post(
  "/:entityType/:entityId",
  [body("content").trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const result = await pool.query(
        `INSERT INTO comments (organization_id, entity_type, entity_id, content, user_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.orgId, req.params.entityType, req.params.entityId, req.body.content, req.user.id]
      );

      // Fetch user info
      const comment = result.rows[0];
      comment.user_name = req.user.name;

      res.status(201).json({ comment });
    } catch (err) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  }
);

// Update comment
router.put("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE comments SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND organization_id = $4 RETURNING *`,
      [req.body.content, req.params.id, req.user.id, req.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Comment not found" });
    res.json({ comment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete comment
router.delete("/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM comments WHERE id = $1 AND user_id = $2 AND organization_id = $3",
      [req.params.id, req.user.id, req.orgId]
    );
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;

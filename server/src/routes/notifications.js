const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require("../services/notifications");

const router = express.Router();
router.use(authenticate);

// Get notifications
router.get("/", async (req, res) => {
  try {
    const { unread_only } = req.query;
    const notifications = await getUserNotifications(req.user.id, {
      unreadOnly: unread_only === "true",
    });
    const unreadCount = await getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/count", async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

// Mark single as read
router.put("/:id/read", async (req, res) => {
  try {
    await markAsRead(req.params.id, req.user.id);
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Mark all as read
router.put("/read-all", async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

module.exports = router;

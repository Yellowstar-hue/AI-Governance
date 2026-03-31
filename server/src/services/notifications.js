const { pool } = require("../config/database");

const NotificationType = {
  INCIDENT_REPORTED: "incident_reported",
  INCIDENT_ESCALATED: "incident_escalated",
  CERT_IN_DEADLINE: "cert_in_deadline",
  COMPLIANCE_UPDATE: "compliance_update",
  RISK_IDENTIFIED: "risk_identified",
  RISK_ESCALATED: "risk_escalated",
  VENDOR_ASSESSMENT_DUE: "vendor_assessment_due",
  POLICY_REVIEW: "policy_review",
  ASSESSMENT_ASSIGNED: "assessment_assigned",
  ASSESSMENT_COMPLETED: "assessment_completed",
  REPORT_READY: "report_ready",
  USER_INVITED: "user_invited",
  SUBSCRIPTION_EXPIRING: "subscription_expiring",
  COMMENT_ADDED: "comment_added",
  WEBHOOK_FAILED: "webhook_failed",
};

const createNotification = async ({
  userId,
  organizationId,
  type,
  title,
  message,
  link,
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, organization_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, organizationId, type, title, message, link]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Notification error:", err);
  }
};

// Notify all users in org with specific roles
const notifyOrgUsers = async (organizationId, roles, notification) => {
  try {
    const users = await pool.query(
      "SELECT id FROM users WHERE organization_id = $1 AND role = ANY($2) AND is_active = true",
      [organizationId, roles]
    );

    for (const user of users.rows) {
      await createNotification({
        userId: user.id,
        organizationId,
        ...notification,
      });
    }
  } catch (err) {
    console.error("Bulk notification error:", err);
  }
};

const getUserNotifications = async (userId, { limit = 20, unreadOnly = false }) => {
  let query = "SELECT * FROM notifications WHERE user_id = $1";
  const params = [userId];

  if (unreadOnly) {
    query += " AND is_read = false";
  }

  query += " ORDER BY created_at DESC LIMIT $2";
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

const markAsRead = async (notificationId, userId) => {
  await pool.query(
    "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  await pool.query(
    "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
    [userId]
  );
};

const getUnreadCount = async (userId) => {
  const result = await pool.query(
    "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
    [userId]
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  NotificationType,
  createNotification,
  notifyOrgUsers,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};

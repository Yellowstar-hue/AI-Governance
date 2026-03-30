const { pool } = require("../config/database");

const logAuditEvent = async ({
  userId,
  organizationId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        organizationId,
        action,
        entityType,
        entityId,
        JSON.stringify(details || {}),
        ipAddress,
      ]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

module.exports = { logAuditEvent };

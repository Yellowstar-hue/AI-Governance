const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      "SELECT id, email, name, role, organization_id FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Insufficient permissions" });
    }
    next();
  };
};

const tenantIsolation = (req, res, next) => {
  if (!req.user.organization_id) {
    return res.status(403).json({ error: "No organization associated" });
  }
  req.orgId = req.user.organization_id;
  next();
};

module.exports = { authenticate, authorize, tenantIsolation };

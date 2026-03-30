const { Pool } = require("pg");
require("dotenv").config();

// Railway provides DATABASE_URL; fallback to individual vars for local dev
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || "aisafe",
        user: process.env.DB_USER || "aisafe_user",
        password: process.env.DB_PASSWORD || "password",
      }
);

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
  process.exit(-1);
});

module.exports = { pool };

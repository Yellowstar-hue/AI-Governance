/**
 * AISafe Railway Production Startup
 * Starts the server FIRST (so healthcheck passes), then runs migrations.
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const runMigrations = async (retries = 5) => {
  const pool = new Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT || "5432"),
          database: process.env.DB_NAME || "aisafe",
          user: process.env.DB_USER || "aisafe_user",
          password: process.env.DB_PASSWORD || "password",
        }
  );

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[migrations] Attempt ${attempt}/${retries} - connecting to database...`);
      const client = await pool.connect();

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT NOW()
          )
        `);

        const migrationDir = path.join(__dirname, "..", "migrations");
        const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql")).sort();

        for (const file of files) {
          const executed = await client.query("SELECT id FROM _migrations WHERE name = $1", [file]);
          if (executed.rows.length === 0) {
            console.log(`[migrations] Running: ${file}`);
            const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
            await client.query(sql);
            await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
            console.log(`[migrations] Completed: ${file}`);
          } else {
            console.log(`[migrations] Skipping (already run): ${file}`);
          }
        }

        console.log("[migrations] All migrations complete.");
        client.release();
        await pool.end();
        return true;
      } catch (err) {
        client.release();
        throw err;
      }
    } catch (err) {
      console.error(`[migrations] Attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        const delay = attempt * 3000;
        console.log(`[migrations] Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error("[migrations] All attempts failed. Tables may not exist.");
        try { await pool.end(); } catch (e) { /* ignore */ }
        return false;
      }
    }
  }
};

const runSeeds = async () => {
  try {
    console.log("[seeds] Seeding regulatory frameworks...");
    const { execSync } = require("child_process");
    execSync("node src/seeds/index.js", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
      env: process.env,
    });
    console.log("[seeds] Frameworks seeded.");
  } catch (err) {
    console.warn("[seeds] Framework seeding failed (may already exist):", err.message);
  }

  try {
    console.log("[seeds] Seeding templates...");
    const { execSync } = require("child_process");
    execSync("node src/seeds/templates.js", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
      env: process.env,
    });
    console.log("[seeds] Templates seeded.");
  } catch (err) {
    console.warn("[seeds] Template seeding failed (may already exist):", err.message);
  }
};

const start = async () => {
  console.log("=== AISafe Production Startup ===");
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.substring(0, 30) + "...)" : "NOT SET"}`);
  console.log(`PORT: ${process.env.PORT || 3000}`);

  // Start the server FIRST so Railway healthcheck passes
  console.log("[startup] Starting AISafe API server...");
  require("./index.js");

  // Run migrations with retry (DB might not be ready immediately)
  console.log("[startup] Running migrations...");
  const success = await runMigrations();

  if (success) {
    await runSeeds();
  }

  console.log("[startup] Startup complete.");
};

start();

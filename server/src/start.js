/**
 * AISafe Railway Production Startup
 * Runs migrations and seeds automatically on deploy, then starts the server.
 */
const { execSync } = require("child_process");
const path = require("path");

const run = (cmd, label) => {
  try {
    console.log(`[startup] ${label}...`);
    execSync(cmd, {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
      env: process.env,
    });
    console.log(`[startup] ${label} - done`);
  } catch (err) {
    console.error(`[startup] ${label} - failed:`, err.message);
    // Don't exit on seed failures (may already be seeded)
    if (label.includes("migration")) {
      process.exit(1);
    }
  }
};

const start = async () => {
  console.log("=== AISafe Production Startup ===");
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "production"}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "set" : "not set"}`);
  console.log(`REDIS_URL: ${process.env.REDIS_URL ? "set" : "not set"}`);

  // Run migrations
  run("node migrations/run.js", "Running database migrations");

  // Seed frameworks (idempotent - skips if already seeded)
  run("node src/seeds/index.js", "Seeding regulatory frameworks");

  // Seed templates (idempotent)
  run("node src/seeds/templates.js", "Seeding policy & assessment templates");

  // Start the server
  console.log("[startup] Starting AISafe API server...");
  require("./index.js");
};

start();

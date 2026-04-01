/**
 * AISafe Railway Production Startup
 * Starts the server FIRST (so healthcheck passes), then runs migrations in background.
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
  }
};

const start = async () => {
  console.log("=== AISafe Production Startup ===");
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "production"}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "set" : "not set"}`);
  console.log(`REDIS_URL: ${process.env.REDIS_URL ? "set" : "not set"}`);
  console.log(`PORT: ${process.env.PORT || 3000}`);

  // Start the server FIRST so Railway healthcheck passes
  console.log("[startup] Starting AISafe API server...");
  require("./index.js");

  // Then run migrations and seeds (server is already accepting requests)
  setTimeout(() => {
    console.log("[startup] Running post-start tasks...");
    run("node migrations/run.js", "Running database migrations");
    run("node src/seeds/index.js", "Seeding regulatory frameworks");
    run("node src/seeds/templates.js", "Seeding policy & assessment templates");
    console.log("[startup] All post-start tasks complete.");
  }, 2000);
};

start();

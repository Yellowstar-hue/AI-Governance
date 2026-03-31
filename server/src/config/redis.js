require("dotenv").config();

// Redis is OPTIONAL — platform works fully without it.
// Railway free tier: skip Redis to save credits.

let redisClient = null;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  // Only attempt connection if REDIS_URL is explicitly set
  if (!redisUrl && !process.env.REDIS_HOST) {
    console.log("Redis not configured — running without cache (this is fine)");
    return;
  }

  try {
    const { createClient } = require("redis");
    const url =
      redisUrl ||
      `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;

    redisClient = createClient({ url });

    redisClient.on("error", (err) => {
      console.warn("Redis error:", err.message);
      redisClient = null;
    });

    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.warn("Redis not available, running without cache:", err.message);
    redisClient = null;
  }
};

// Safe cache helpers that no-op when Redis is unavailable
const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!redisClient) return;
  try {
    await redisClient.set(key, value, { EX: ttlSeconds });
  } catch {
    // ignore
  }
};

const cacheDel = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch {
    // ignore
  }
};

module.exports = { redisClient, connectRedis, cacheGet, cacheSet, cacheDel };

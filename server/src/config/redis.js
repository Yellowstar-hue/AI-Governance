const { createClient } = require("redis");
require("dotenv").config();

// Railway provides REDIS_URL
const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;

const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn("Redis not available, running without cache:", err.message);
  }
};

module.exports = { redisClient, connectRedis };

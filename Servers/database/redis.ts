import IORedis from "ioredis";

export const REDIS_URL = process.env.REDIS_URL || "";

let redisClient: IORedis;

if (REDIS_URL) {
  redisClient = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 500, 2000);
    },
  });
  redisClient.on("error", (err: Error) => {
    console.warn("Redis connection error (non-fatal):", err.message);
  });
} else {
  console.log("REDIS_URL not set — running without Redis (queues/caching disabled)");
  // Create a mock client that no-ops
  redisClient = {
    ping: async () => "PONG",
    get: async () => null,
    set: async () => "OK",
    del: async () => 0,
    quit: async () => "OK",
    subscribe: async () => {},
    on: () => redisClient,
    publish: async () => 0,
    status: "ready",
  } as any;
}

export default redisClient;

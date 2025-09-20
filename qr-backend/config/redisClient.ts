import { createClient } from "redis";
import type { RedisClientType } from "redis";


export let redis: RedisClientType;

export async function connectRedis(): Promise<void> {
  redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  redis.on("error", (err: Error) => {
    console.error("Redis Client Error", err);
  });

  await redis.connect();
  console.log("Connected to Redis");
}

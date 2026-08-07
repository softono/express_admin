import redisClient from "./redis";
import config from "@/config";
import NodeCache from "node-cache";

const useRedis = !!(
  config.CACHE_DRIVER && config.CACHE_DRIVER.toLowerCase() === "redis"
);
const nodeCache = new NodeCache({ stdTTL: 0, checkperiod: 60 });

/**
 * Set a stringifiable value in cache. `ttlSeconds` is TTL in seconds.
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds = 60,
): Promise<boolean> {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (useRedis) {
    try {
      if (redisClient?.isOpen) {
        await redisClient.set(key, str);
        try {
          await redisClient.expire(key, ttlSeconds);
        } catch {
          /* ignore */
        }
        return true;
      }
    } catch {
      // fall through to memory fallback
    }
  }

  nodeCache.set(key, str, ttlSeconds);
  return true;
}

/**
 * Get raw string value from cache or null if missing.
 */
export async function getCache(key: string): Promise<string | null> {
  if (useRedis) {
    try {
      if (redisClient?.isOpen) {
        const v = await redisClient.get(key);
        return v ?? null;
      }
    } catch {
      // fallback
    }
  }

  const v = nodeCache.get<string>(key);
  return v ?? null;
}

/**
 * Atomically increment a counter and set TTL on first write. Returns the new count.
 */
export async function incrCache(
  key: string,
  windowSeconds = 60,
): Promise<{ count: number; ttl: number }> {
  if (useRedis) {
    try {
      if (redisClient?.isOpen) {
        const count = await redisClient.incr(key);
        if (count === 1) {
          await redisClient.expire(key, windowSeconds).catch(() => {
            /* ignore */
          });
        }
        const ttl = await redisClient.ttl(key);
        return {
          count,
          ttl: typeof ttl === "number" && ttl > 0 ? ttl : windowSeconds,
        };
      }
    } catch {
      // fall through to memory fallback
    }
  }

  const cur = nodeCache.get<number>(key) ?? 0;
  const expireAt = nodeCache.getTtl(key);
  const ttl = expireAt
    ? Math.max(Math.ceil((expireAt - Date.now()) / 1000), 0)
    : windowSeconds;
  const count = cur + 1;
  nodeCache.set(key, count, cur === 0 ? windowSeconds : ttl);
  return { count, ttl: cur === 0 ? windowSeconds : ttl };
}

/**
 * Delete a cache key.
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (useRedis) {
    try {
      if (redisClient?.isOpen) {
        await redisClient.del(key);
        return true;
      }
    } catch {
      // fallback
    }
  }

  nodeCache.del(key);
  return true;
}

/**
 * Flush all cache entries.
 */
export async function flushCache(): Promise<boolean> {
  if (useRedis) {
    try {
      if (redisClient?.isOpen) {
        await redisClient.flushAll();
        return true;
      }
    } catch {
      // fallback
    }
  }

  nodeCache.flushAll();
  return true;
}

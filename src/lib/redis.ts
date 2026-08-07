import Redis from "ioredis";
import config from "@/config";
import { errorLog } from "@/lib/logger";

export interface CacheClient {
  isOpen: boolean;
  connect: () => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  ttl: (key: string) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
  flushAll: () => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => unknown;
}

let redisClient: CacheClient;

if (config.CACHE_DRIVER && config.CACHE_DRIVER.toLowerCase() === "memory") {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  redisClient = {
    isOpen: false,
    connect: async () => {},
    get: async (key: string) => null,
    set: async (key: string, value: string) => "OK",
    del: async (key: string) => 0,
    expire: async (key: string, seconds: number) => 1,
    ttl: async (key: string) => -2,
    incr: async (key: string) => 0,
    flushAll: async () => {},
    on: () => redisClient,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
} else {
  const ioredis = new Redis(config.REDIS_URL || "");

  ioredis.on("error", () => errorLog("Redis client error"));

  redisClient = {
    get isOpen() {
      return ioredis.status === "ready";
    },
    connect: async () => {},
    get: (key: string) => ioredis.get(key),
    set: (key: string, value: string) => ioredis.set(key, value),
    del: (key: string) => ioredis.del(key),
    expire: (key: string, seconds: number) => ioredis.expire(key, seconds),
    ttl: (key: string) => ioredis.ttl(key),
    incr: (key: string) => ioredis.incr(key),
    flushAll: () => ioredis.flushall(),
    on: (event: string, listener: (...args: unknown[]) => void) =>
      ioredis.on(event, listener),
  };
}

export default redisClient;

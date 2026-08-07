import { incrCache } from "./cache";

export async function rateLimit(
  key: string,
  max = 15,
  windowSeconds = 300,
  failClosed = false,
): Promise<{
  status: boolean;
  message?: string;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const { count, ttl } = await incrCache(key, windowSeconds);
    const remaining = Math.max(max - count, 0);

    if (count > max) {
      return {
        status: false,
        message: "Too many attempts",
        limit: max,
        remaining,
        reset: ttl,
      };
    }
    return { status: true, limit: max, remaining, reset: ttl };
  } catch {
    if (failClosed) {
      return {
        status: false,
        message: "Too many attempts",
        limit: max,
        remaining: 0,
        reset: windowSeconds,
      };
    }
    return { status: true, limit: max, remaining: max, reset: windowSeconds };
  }
}

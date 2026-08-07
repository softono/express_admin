import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/utils/clientInfo";

// Mirrors the Next.js proxy rate-limit map. Prefix order matters:
// "/api/auth/login" is checked first, so login-otp also falls under the
// 10-request bucket, exactly like the original proxy.
const LOGIN_PREFIXES = ["/api/auth/login", "/api/admin/auth/login"];
const STRICT_PREFIXES = [
  "/api/auth/otp",
  "/api/auth/login-otp",
  "/api/auth/tfa",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-account",
];

export async function apiRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const pathname = req.path;

  let limit = 0;
  if (LOGIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    limit = 10;
  } else if (STRICT_PREFIXES.some((p) => pathname.startsWith(p))) {
    limit = 5;
  }

  if (limit === 0) return next();

  const rateResult = await rateLimit(
    `${pathname}:${getClientIp(req)}`,
    limit,
    15 * 60,
    true,
  );
  if (!rateResult.status) {
    res
      .status(429)
      .set({
        "Retry-After": String(rateResult.reset),
        "X-RateLimit-Limit": String(rateResult.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rateResult.reset),
      })
      .json({
        status: 0,
        message: "Too many requests, please try again later.",
        data: [],
      });
    return;
  }
  next();
}

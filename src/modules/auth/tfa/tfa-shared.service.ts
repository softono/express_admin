import { type IUserTwoFactor } from "@/models/schema";
import {
  bumpTfaAttempts,
  consumeTfaChallenge,
  checkPassword,
} from "@/lib/auth";
import { getPasswordHash } from "@/modules/auth/auth.service";
import { findTwoFactorByUser } from "@/models/user-two-factor.repository";
import type { ApiResult } from "@/types";

export async function requirePassword(
  userId: string,
  password: string,
): Promise<ApiResult | null> {
  const hash = await getPasswordHash(userId);
  if (!hash) {
    return {
      http_status: 400,
      status: 0,
      message: "No password set for this account",
    };
  }
  const valid = await checkPassword(hash, password);
  if (!valid) {
    return { http_status: 401, status: 0, message: "Invalid password" };
  }
  return null;
}

// Record a failed 2FA login attempt against the challenge. When the cap is
// reached the challenge is destroyed and a terminal error is returned; the
// caller should pass this through. Returns null when the attempt is allowed.
export async function registerTfaFailure(
  tfaHandle: string,
  message: string,
): Promise<ApiResult> {
  const capped = await bumpTfaAttempts(tfaHandle);
  if (capped) {
    await consumeTfaChallenge(tfaHandle);
    return {
      http_status: 429,
      status: 0,
      message: "Too many failed attempts. Please log in again.",
    };
  }
  return { http_status: 401, status: 0, message };
}

export async function getTfaRecord(
  userId: string,
): Promise<IUserTwoFactor | null> {
  return findTwoFactorByUser(userId);
}

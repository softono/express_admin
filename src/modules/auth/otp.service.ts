import { randomInt } from "crypto";

import { hashPassword, checkPassword } from "@/lib/auth/password";
import config from "@/config";
import {
  deleteVerificationByIdentifier,
  insertVerification,
  findActiveVerificationByIdentifier,
  incrementVerificationAttempts,
  deleteVerificationById,
} from "@/models/user-verification.repository";

const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  const max = Math.pow(10, OTP_LENGTH);
  const min = Math.pow(10, OTP_LENGTH - 1);
  return String(randomInt(min, max));
}

export async function issueOtp(
  purpose: string,
  email: string,
  ttlSeconds?: number,
): Promise<string> {
  const identifier = `${purpose}:${email.toLowerCase()}`;
  const otp = generateOtp();
  const hashed = await hashPassword(otp);
  const ttl = ttlSeconds || config.OTP_EXPIRE_SEC;
  const expiresAt = new Date(Date.now() + ttl * 1000);

  // Remove any existing OTP for this identifier
  await deleteVerificationByIdentifier(identifier);

  await insertVerification({
    identifier,
    value: hashed,
    expires_at: expiresAt,
    attempts: 0,
  });

  return otp;
}

export async function verifyOtp(
  purpose: string,
  email: string,
  otp: string,
): Promise<{ valid: boolean; message: string }> {
  const identifier = `${purpose}:${email.toLowerCase()}`;

  const record = await findActiveVerificationByIdentifier(identifier);

  if (!record) {
    return { valid: false, message: "OTP expired or not found" };
  }

  // Reserve the attempt atomically before checking, so concurrent requests
  // can't race past the cap between a read and a later increment.
  const updated = await incrementVerificationAttempts(record.id);

  if (!updated || updated.attempts > MAX_ATTEMPTS) {
    await deleteVerificationById(record.id);
    return { valid: false, message: "Too many failed attempts" };
  }

  const isValid = await checkPassword(record.value, otp);

  if (!isValid) {
    return { valid: false, message: "Invalid OTP" };
  }

  await deleteVerificationById(record.id);
  return { valid: true, message: "OTP verified" };
}

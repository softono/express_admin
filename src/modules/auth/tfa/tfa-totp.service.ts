import type { Request } from "express";
import { type IUserTwoFactor } from "@/models/schema";
import {
  generateTotpSecret,
  getTotpKeyUri,
  verifyTotp,
  generateBackupCodes,
  consumeTfaChallenge,
  peekTfaChallenge,
  issueSession,
} from "@/lib/auth";
import { toSafeUser, getUserById } from "@/modules/account/user.service";
import { logActivity } from "@/modules/account/user-activity.service";
import { trustDevice } from "@/modules/auth/device.service";
import type { ApiResult } from "@/types";
import {
  updateTwoFactor,
  insertTwoFactor,
} from "@/models/user-two-factor.repository";
import {
  requirePassword,
  registerTfaFailure,
  getTfaRecord,
} from "@/modules/auth/tfa/tfa-shared.service";
import { type ClientInfo } from "@/utils/clientInfo";

export async function setup(
  req: Request,
  userId: string,
  password: string,
): Promise<ApiResult> {
  const pwError = await requirePassword(userId, password);
  if (pwError) return pwError;

  const existing = await getTfaRecord(userId);
  if (existing?.verified) {
    return { http_status: 400, status: 0, message: "2FA is already enabled" };
  }

  const secret = generateTotpSecret();
  const user = await getUserById(userId);
  const uri = getTotpKeyUri(secret, user?.email || "");
  const { plain, hashed } = await generateBackupCodes();

  if (existing) {
    await updateTwoFactor(existing.id, {
      secret,
      backup_codes: JSON.stringify(hashed),
      verified: false,
    });
  } else {
    await insertTwoFactor({
      secret,
      backup_codes: JSON.stringify(hashed),
      user_id: userId,
      verified: false,
    });
  }

  return {
    http_status: 200,
    status: 1,
    message: "Scan the QR code with your authenticator app",
    data: { totpURI: uri, backupCodes: plain },
  };
}

export async function verifySetupCode(
  userId: string,
  record: IUserTwoFactor,
  code: string,
): Promise<{ valid: boolean; message?: string }> {
  const valid = await verifyTotp(code, record.secret);
  return valid ? { valid: true } : { valid: false, message: "Invalid code" };
}

export async function markVerified(record: IUserTwoFactor): Promise<void> {
  await updateTwoFactor(record.id, { verified: true });
}

export async function verifyLogin(
  req: Request,
  tfaHandle: string,
  code: string,
  clientInfo: ClientInfo,
  trustDeviceFlag = false,
): Promise<ApiResult> {
  const pending = await peekTfaChallenge(tfaHandle);
  if (!pending) {
    return { http_status: 401, status: 0, message: "Challenge expired" };
  }

  const record = await getTfaRecord(pending.userId);
  if (!record || !record.verified) {
    return { http_status: 400, status: 0, message: "2FA not configured" };
  }

  const valid = await verifyTotp(code, record.secret);
  if (!valid) {
    return registerTfaFailure(tfaHandle, "Invalid code");
  }

  await consumeTfaChallenge(tfaHandle);
  if (trustDeviceFlag) await trustDevice(req, pending.userId);
  const { token } = await issueSession(req, pending.userId, {
    remember: pending.remember,
  });
  await logActivity("LOGIN_SUCCESS", pending.userId, clientInfo);

  const user = await getUserById(pending.userId);
  return {
    http_status: 200,
    status: 1,
    message: "Login successful",
    data: { token, user: user ? toSafeUser(user) : null },
  };
}

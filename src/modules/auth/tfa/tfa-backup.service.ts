import type { Request } from "express";
import {
  generateBackupCodes,
  verifyBackupCode,
  consumeTfaChallenge,
  peekTfaChallenge,
  issueSession,
} from "@/lib/auth";
import { toSafeUser } from "@/modules/account/user.service";
import { logActivity } from "@/modules/account/user-activity.service";
import { getUserById } from "@/modules/account/user.service";
import { trustDevice } from "@/modules/auth/device.service";
import type { ApiResult } from "@/types";
import { updateTwoFactor } from "@/models/user-two-factor.repository";
import {
  requirePassword,
  registerTfaFailure,
  getTfaRecord,
} from "@/modules/auth/tfa/tfa-shared.service";
import { type ClientInfo } from "@/utils/clientInfo";

export async function regenerateBackupCodes(
  clientInfo: ClientInfo,
  userId: string,
  password: string,
): Promise<ApiResult> {
  const pwError = await requirePassword(userId, password);
  if (pwError) return pwError;

  const record = await getTfaRecord(userId);
  if (!record || !record.verified) {
    return { http_status: 400, status: 0, message: "2FA not enabled" };
  }

  const { plain, hashed } = await generateBackupCodes();
  await updateTwoFactor(record.id, { backup_codes: JSON.stringify(hashed) });

  await logActivity("BACKUP_CODES_REGENERATED", userId, clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Backup codes regenerated",
    data: { backupCodes: plain },
  };
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
  if (!record) {
    return { http_status: 400, status: 0, message: "2FA not configured" };
  }

  const hashedCodes: string[] = JSON.parse(record.backup_codes);
  const result = await verifyBackupCode(code, hashedCodes);
  if (!result.valid) {
    return registerTfaFailure(tfaHandle, "Invalid backup code");
  }

  await updateTwoFactor(record.id, {
    backup_codes: JSON.stringify(result.remaining),
  });

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

import { type IUserTwoFactor } from "@/models/schema";
import { peekTfaChallenge, invalidateUserCache } from "@/lib/auth";
import { logActivity } from "@/modules/account/user-activity.service";
import { getUserById } from "@/modules/account/user.service";
import { revokeAllDeviceTrust } from "@/modules/auth/device.service";
import type { ApiResult } from "@/types";
import {
  deleteTwoFactorByUser,
  updateTwoFactor,
} from "@/models/user-two-factor.repository";
import { updateUser } from "@/models/user.repository";
import {
  requirePassword,
  getTfaRecord,
} from "@/modules/auth/tfa/tfa-shared.service";
import * as Totp from "@/modules/auth/tfa/tfa-totp.service";
import * as Otp from "@/modules/auth/tfa/tfa-otp.service";
import * as Backup from "@/modules/auth/tfa/tfa-backup.service";
import { type ClientInfo } from "@/utils/clientInfo";

type SetupMethod = "totp" | "otp";

// Registry of setup-verification methods. Adding a new method (e.g. a
// hardware key) means adding an entry here, not editing this dispatch.
const setupVerifiers: Record<
  SetupMethod,
  (
    userId: string,
    record: IUserTwoFactor,
    code: string,
  ) => Promise<{ valid: boolean; message?: string }>
> = {
  totp: Totp.verifySetupCode,
  otp: Otp.verifySetupCode,
};

const setupOnSuccess: Partial<
  Record<SetupMethod, (record: IUserTwoFactor) => Promise<void>>
> = {
  totp: Totp.markVerified,
};

export const enable = Totp.setup;
export const sendTfaOtp = Otp.sendTfaOtp;
export const verifyTotpLogin = Totp.verifyLogin;
export const verifyOtpLogin = Otp.verifyLogin;
export const verifyBackupLogin = Backup.verifyLogin;
export const regenerateBackupCodes = Backup.regenerateBackupCodes;

export async function verifySetup(
  userId: string,
  code: string,
  clientInfo: ClientInfo,
  method: SetupMethod = "totp",
): Promise<ApiResult> {
  const record = await getTfaRecord(userId);
  if (!record) {
    return { http_status: 400, status: 0, message: "2FA not initialized" };
  }
  if (record.verified) {
    return { http_status: 400, status: 0, message: "2FA already verified" };
  }

  const result = await setupVerifiers[method](userId, record, code);
  if (!result.valid) {
    return {
      http_status: 400,
      status: 0,
      message: result.message || "Invalid code",
    };
  }

  await setupOnSuccess[method]?.(record);
  await updateUser(userId, { two_factor_enabled: true });

  await invalidateUserCache(userId);
  await logActivity("TFA_ENABLED", userId, clientInfo);

  return { http_status: 200, status: 1, message: "2FA enabled" };
}

export async function disable(
  userId: string,
  password: string,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const pwError = await requirePassword(userId, password);
  if (pwError) return pwError;

  await deleteTwoFactorByUser(userId);
  await updateUser(userId, { two_factor_enabled: false });
  await revokeAllDeviceTrust(userId);

  await invalidateUserCache(userId);
  await logActivity("TFA_DISABLED", userId, clientInfo);

  return { http_status: 200, status: 1, message: "2FA disabled" };
}

export async function removeAuthenticator(
  userId: string,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const record = await getTfaRecord(userId);
  if (!record?.verified) {
    return {
      http_status: 400,
      status: 0,
      message: "Authenticator app is not configured",
    };
  }

  await updateTwoFactor(record.id, { verified: false });

  await invalidateUserCache(userId);
  await logActivity("TFA_AUTHENTICATOR_REMOVED", userId, clientInfo);

  return { http_status: 200, status: 1, message: "Authenticator app removed" };
}

export async function getChallengeMethods(
  tfaHandle: string,
): Promise<ApiResult> {
  const pending = await peekTfaChallenge(tfaHandle);
  if (!pending) {
    return { http_status: 401, status: 0, message: "Challenge expired" };
  }

  const record = await getTfaRecord(pending.userId);
  const methods: ("totp" | "otp" | "backup" | "login_link")[] = [
    "otp",
    "login_link",
  ];
  if (record?.verified) methods.push("totp");
  if (record) methods.push("backup");

  return {
    http_status: 200,
    status: 1,
    message: "ok",
    data: { methods },
  };
}

export async function getStatus(userId: string): Promise<ApiResult> {
  const record = await getTfaRecord(userId);
  return {
    http_status: 200,
    status: 1,
    message: "ok",
    data: {
      two_factor_enabled:
        (await getUserById(userId))?.two_factor_enabled ?? false,
      totp_verified: record?.verified === true,
    },
  };
}

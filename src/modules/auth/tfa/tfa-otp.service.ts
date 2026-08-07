import type { Request } from "express";
import { type IUserTwoFactor } from "@/models/schema";
import {
  issueOtp,
  verifyOtp as verifyEmailOtp,
  consumeTfaChallenge,
  peekTfaChallenge,
  issueSession,
} from "@/lib/auth";
import { toSafeUser } from "@/modules/account/user.service";
import { sendEmail } from "@/lib/mailer";
import { logActivity } from "@/modules/account/user-activity.service";
import { getUserById } from "@/modules/account/user.service";
import { trustDevice } from "@/modules/auth/device.service";
import type { ApiResult } from "@/types";
import { registerTfaFailure } from "@/modules/auth/tfa/tfa-shared.service";
import { type ClientInfo } from "@/utils/clientInfo";

export async function sendTfaOtp(
  req: Request,
  userId: string,
): Promise<ApiResult> {
  const user = await getUserById(userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  const otp = await issueOtp("tfa", user.email);
  await sendEmail(user.email, "otp", {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email,
    otp,
    message: "Login verification",
  });

  return { http_status: 200, status: 1, message: "OTP sent" };
}

export async function verifySetupCode(
  userId: string,
  record: IUserTwoFactor,
  code: string,
): Promise<{ valid: boolean; message?: string }> {
  const user = await getUserById(userId);
  if (!user) return { valid: false, message: "User not found" };

  const result = await verifyEmailOtp("tfa", user.email, code);
  return result.valid
    ? { valid: true }
    : { valid: false, message: result.message };
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

  const user = await getUserById(pending.userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  const result = await verifyEmailOtp("tfa", user.email, code);
  if (!result.valid) {
    return registerTfaFailure(tfaHandle, result.message);
  }

  await consumeTfaChallenge(tfaHandle);
  if (trustDeviceFlag) await trustDevice(req, pending.userId);
  const { token } = await issueSession(req, pending.userId, {
    remember: pending.remember,
  });
  await logActivity("LOGIN_SUCCESS", pending.userId, clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Login successful",
    data: { token, user: toSafeUser(user) },
  };
}

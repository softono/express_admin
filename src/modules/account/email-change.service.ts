import {
  verifyOtp as verifyEmailOtp,
  issueOtp,
  verifyTotp,
  verifyBackupCode,
  createEmailChangeChallenge,
  peekEmailChangeChallenge,
  markEmailChangeVerified,
  consumeEmailChangeChallenge,
  bumpEmailChangeAttempts,
  invalidateUserCache,
  type EmailChangePending,
} from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";
import {
  getUserById,
  saveUser,
  toSafeUser,
} from "@/modules/account/user.service";
import { validateUniqueData } from "@/modules/account/account.service";
import { logActivityData } from "@/modules/account/user-activity.service";
import {
  requirePassword,
  getTfaRecord,
} from "@/modules/auth/tfa/tfa-shared.service";
import { updateTwoFactor } from "@/models/user-two-factor.repository";
import type {
  EmailChangeStartInput,
  EmailChangeVerifyNewInput,
  EmailChangeVerifyInput,
  EmailChangeVerifyMethod,
} from "@/modules/account/email.validator";
import { type ClientInfo } from "@/utils/clientInfo";
import type { ApiResult } from "@/types";

const OTP_PURPOSE = "email-change";

const expiredResult: ApiResult = {
  http_status: 401,
  status: 0,
  message: "Challenge expired. Please start over.",
};

async function sendNewEmailOtp(
  newEmail: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  const otp = await issueOtp(OTP_PURPOSE, newEmail);
  await sendEmail(newEmail, "otp", {
    first_name: firstName,
    last_name: lastName,
    email: newEmail,
    otp,
    message: "Email change verification",
  });
}

// Record a failed attempt; destroys the challenge when the cap is reached.
async function registerFailure(
  handle: string,
  message: string,
): Promise<ApiResult> {
  const capped = await bumpEmailChangeAttempts(handle);
  if (capped) {
    await consumeEmailChangeChallenge(handle);
    return {
      http_status: 429,
      status: 0,
      message: "Too many failed attempts. Please start over.",
    };
  }
  return { http_status: 401, status: 0, message };
}

async function getPending(
  userId: string,
  handle: string,
): Promise<EmailChangePending | null> {
  const pending = await peekEmailChangeChallenge(handle);
  if (!pending || pending.userId !== userId) return null;
  return pending;
}

export async function startEmailChange(
  userId: string,
  data: EmailChangeStartInput,
): Promise<ApiResult> {
  const pwError = await requirePassword(userId, data.password);
  if (pwError) return pwError;

  const user = await getUserById(userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  if (data.email === user.email) {
    return {
      http_status: 400,
      status: 0,
      message: "New email is the same as your current email",
    };
  }

  const unique = await validateUniqueData(data.email, undefined, userId);
  if (unique) return unique;

  const handle = await createEmailChangeChallenge(userId, data.email);
  await sendNewEmailOtp(data.email, user.first_name, user.last_name);

  return {
    http_status: 200,
    status: 1,
    message: "Verification code sent to your new email",
    data: { handle },
  };
}

export async function resendNewEmailOtp(
  userId: string,
  handle: string,
): Promise<ApiResult> {
  const pending = await getPending(userId, handle);
  if (!pending || pending.newEmailVerified) return expiredResult;

  const user = await getUserById(userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  await sendNewEmailOtp(pending.newEmail, user.first_name, user.last_name);
  return {
    http_status: 200,
    status: 1,
    message: "Verification code sent to your new email",
  };
}

export async function verifyNewEmail(
  userId: string,
  data: EmailChangeVerifyNewInput,
): Promise<ApiResult> {
  const pending = await getPending(userId, data.handle);
  if (!pending) return expiredResult;

  const result = await verifyEmailOtp(OTP_PURPOSE, pending.newEmail, data.code);
  if (!result.valid) return registerFailure(data.handle, result.message);

  await markEmailChangeVerified(pending, data.handle);

  const record = await getTfaRecord(userId);
  const methods: EmailChangeVerifyMethod[] = ["otp"];
  if (record?.verified) methods.push("totp");
  if (record) methods.push("backup");

  return {
    http_status: 200,
    status: 1,
    message: "New email verified",
    data: { methods },
  };
}

export async function verifyEmailChange(
  userId: string,
  data: EmailChangeVerifyInput,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const pending = await getPending(userId, data.handle);
  if (!pending || !pending.newEmailVerified) return expiredResult;

  const user = await getUserById(userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  if (data.method === "totp") {
    const record = await getTfaRecord(userId);
    if (!record || !record.verified) {
      return { http_status: 400, status: 0, message: "2FA not configured" };
    }
    const valid = await verifyTotp(data.code, record.secret);
    if (!valid) return registerFailure(data.handle, "Invalid code");
  } else if (data.method === "backup") {
    const record = await getTfaRecord(userId);
    if (!record) {
      return { http_status: 400, status: 0, message: "2FA not configured" };
    }
    const hashedCodes: string[] = JSON.parse(record.backup_codes);
    const result = await verifyBackupCode(data.code, hashedCodes);
    if (!result.valid) {
      return registerFailure(data.handle, "Invalid backup code");
    }
    await updateTwoFactor(record.id, {
      backup_codes: JSON.stringify(result.remaining),
    });
  } else {
    const result = await verifyEmailOtp("tfa", user.email, data.code);
    if (!result.valid) return registerFailure(data.handle, result.message);
  }

  await consumeEmailChangeChallenge(data.handle);

  // Race guard: the address may have been taken between start and verify.
  const unique = await validateUniqueData(pending.newEmail, undefined, userId);
  if (unique) return unique;

  const oldEmail = user.email;
  user.email = pending.newEmail;
  user.email_verified = true;
  await saveUser(user);
  await invalidateUserCache(user.id);

  await logActivityData(
    "EMAIL_UPDATE",
    user.id,
    clientInfo,
    { email: oldEmail },
    { email: user.email },
  );

  const freshUser = await getUserById(userId);
  return {
    http_status: 200,
    status: 1,
    message: "Email updated successfully",
    data: { user: freshUser ? toSafeUser(freshUser) : null },
  };
}

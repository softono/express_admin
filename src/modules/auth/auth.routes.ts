import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import db from "@/lib/db";
import { getCache } from "@/lib/cache";
import { getClientTimezone } from "@/lib/date";
import { rateLimit } from "@/lib/rateLimit";
import { validateData } from "@/lib/validator";
import { userAuth } from "@/middleware/auth";
import {
  AuthService,
  TfaService,
  PasskeyService,
  AccountService,
} from "@/modules/auth";
import { changePasswordSchema } from "@/modules/auth/change-password.validator";
import { loginOtpSchema } from "@/modules/auth/login/login-otp.validator";
import { loginSchema } from "@/modules/auth/login/login.validator";
import { otpSendSchema } from "@/modules/auth/otp.validator";
import { resetPasswordSchema } from "@/modules/auth/reset-password.validator";
import { setPasswordSchema } from "@/modules/auth/set-password.validator";
import {
  tfaBackupCodesSchema,
  tfaDisableSchema,
  tfaEnableSchema,
  tfaVerifyLoginSchema,
  tfaVerifySetupSchema,
} from "@/modules/auth/tfa/tfa.validator";
import { verifyAccountSchema } from "@/modules/auth/verify-account.validator";
import { validateSession } from "@/modules/auth/session.service";
import { userAccounts } from "@/models/schema";
import {
  clearSessionCookie,
  clearTfaChallengeCookie,
  clearWebAuthnChallengeCookie,
  getSessionToken,
  getTfaChallengeHandle,
  getWebAuthnChallengeHandle,
  setSessionCookie,
  setTfaChallengeCookie,
  setWebAuthnChallengeCookie,
} from "@/utils/authCookie";
import { getClientInfo, getClientIp } from "@/utils/clientInfo";
import { sendError, sendResult } from "@/utils/response";

const router = Router();

const forgotPasswordSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Please provide a valid email address"),
});

// --- Public routes ---

router.post("/login", async (req, res) => {
  const validated = validateData(loginSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const clientInfo = getClientInfo(req);
  const result = await AuthService.login(req, validated.data, clientInfo);

  if (result.status === 1 && result.data?.token) {
    setSessionCookie(res, result.data.token, {
      remember: validated.data.remember,
    });
    delete result.data.token;
  } else if (result.status === 1 && result.data?.tfaHandle) {
    setTfaChallengeCookie(res, result.data.tfaHandle);
    delete result.data.tfaHandle;
  }
  return sendResult(res, result);
});

router.post("/login-otp", async (req, res) => {
  const validated = validateData(loginOtpSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const data = validated.data;

  if (data.step === 1) {
    return sendResult(
      res,
      await AccountService.sendOtp({ email: data.email, type: "signin" }),
    );
  }

  const clientInfo = getClientInfo(req);
  const result = await AccountService.loginWithOtp(
    req,
    { email: data.email, otp: data.otp || "", remember: data.remember },
    clientInfo,
  );

  if (result.status === 1 && result.data?.token) {
    setSessionCookie(res, result.data.token, { remember: data.remember });
    delete result.data.token;
  } else if (result.status === 1 && result.data?.tfaHandle) {
    setTfaChallengeCookie(res, result.data.tfaHandle);
    delete result.data.tfaHandle;
  }
  return sendResult(res, result);
});

router.post("/otp", async (req, res) => {
  const rl = await rateLimit(`otp:send:${getClientIp(req)}`, 5, 300);
  if (!rl.status) return sendError(res, 429, rl.message || "Too many requests");

  const validated = validateData(otpSendSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  return sendResult(res, await AccountService.sendOtp(validated.data));
});

router.post("/forgot-password", async (req, res) => {
  const validated = validateData(forgotPasswordSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  return sendResult(res, await AccountService.forgotPassword(req, validated.data));
});

router.post("/reset-password", async (req, res) => {
  const validated = validateData(resetPasswordSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  return sendResult(res, await AccountService.resetPassword(validated.data));
});

router.post("/verify-account", async (req, res) => {
  const validated = validateData(verifyAccountSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  return sendResult(res, await AccountService.verifyAccount(validated.data));
});

// --- Passkey login ---

router.post("/passkey/login-options", async (req, res) => {
  const result = await PasskeyService.loginOptions();

  if (result.status === 1 && result.data?.challengeHandle) {
    setWebAuthnChallengeCookie(res, result.data.challengeHandle);
    delete result.data.challengeHandle;
  }
  return sendResult(res, result);
});

router.post("/passkey/login-verify", async (req, res) => {
  const challengeHandle = getWebAuthnChallengeHandle(req);
  if (!challengeHandle) return sendError(res, 400, "No challenge found");

  const clientInfo = getClientInfo(req);
  const result = await PasskeyService.loginVerify(
    req,
    req.body.response,
    challengeHandle,
    clientInfo,
  );

  if (result.status === 1 && result.data?.token) {
    setSessionCookie(res, result.data.token, { remember: true });
    clearWebAuthnChallengeCookie(res);
    delete result.data.token;
  }
  return sendResult(res, result);
});

// --- 2FA login challenge ---

router.get("/tfa/methods", async (req, res) => {
  const tfaHandle = getTfaChallengeHandle(req);
  if (!tfaHandle) return sendError(res, 401, "No 2FA challenge found");

  return sendResult(res, await TfaService.getChallengeMethods(tfaHandle));
});

router.post("/tfa/send-otp", async (req, res) => {
  const rl = await rateLimit(`"tfa:send-otp:${getClientIp(req)}`, 5, 300);
  if (!rl.status) return sendError(res, 429, rl.message || "Too many requests");

  // Authenticated flow (enable 2FA while logged in)
  const sessionToken = getSessionToken(req);
  if (sessionToken) {
    const result = await validateSession(sessionToken);
    if (result) {
      return sendResult(res, await TfaService.sendTfaOtp(req, result.user.id));
    }
  }

  // Login challenge flow (2FA verification during login)
  const tfaHandle = getTfaChallengeHandle(req);
  if (!tfaHandle) return sendError(res, 401, "No 2FA challenge found");

  const raw = await getCache(`auth:tfa:${tfaHandle}`);
  if (!raw) return sendError(res, 401, "Challenge expired");

  const { userId } = JSON.parse(raw) as { userId: string };
  return sendResult(res, await TfaService.sendTfaOtp(req, userId));
});

router.post("/tfa/verify", async (req, res) => {
  const tfaHandle = getTfaChallengeHandle(req);
  if (!tfaHandle) return sendError(res, 401, "No 2FA challenge found");

  const validated = validateData(tfaVerifyLoginSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const { code, method, trust_device } = validated.data;

  const clientInfo = getClientInfo(req);
  const result =
    method === "totp"
      ? await TfaService.verifyTotpLogin(req, tfaHandle, code, clientInfo, trust_device)
      : method === "otp"
        ? await TfaService.verifyOtpLogin(req, tfaHandle, code, clientInfo, trust_device)
        : await TfaService.verifyBackupLogin(req, tfaHandle, code, clientInfo, trust_device);

  if (result.status === 1 && result.data?.token) {
    setSessionCookie(res, result.data.token, { remember: true });
    clearTfaChallengeCookie(res);
    delete result.data.token;
  }
  return sendResult(res, result);
});

// --- Authenticated session routes ---

router.get("/session", async (req, res) => {
  const token = getSessionToken(req);
  if (!token) return sendError(res, 401, "Not authenticated");
  return sendResult(
    res,
    await AuthService.getSession(token, getClientTimezone(req)),
  );
});

router.post("/logout", async (req, res) => {
  const token = getSessionToken(req);
  if (!token) return sendError(res, 401, "Not authenticated");

  const result = await AuthService.logout(token);
  clearSessionCookie(res);
  return sendResult(res, result);
});

router.post("/change-password", userAuth, async (req, res) => {
  const validated = validateData(changePasswordSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const clientInfo = getClientInfo(req);
  const result = await AuthService.changePassword(
    req.user!.id,
    validated.data.current_password,
    validated.data.new_password,
    clientInfo,
  );

  // The change revokes all sessions including this one — clear the cookie so
  // the client is sent back to login instead of holding a dead session.
  if (result.status === 1) {
    clearSessionCookie(res);
  }
  return sendResult(res, result);
});

router.post("/set-password", userAuth, async (req, res) => {
  const validated = validateData(setPasswordSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  const clientInfo = getClientInfo(req);
  return sendResult(
    res,
    await AuthService.setPassword(req.user!.id, validated.data.password, clientInfo),
  );
});

router.get("/list-accounts", userAuth, async (req, res) => {
  const rows = await db
    .select({ providerId: userAccounts.provider_id })
    .from(userAccounts)
    .where(eq(userAccounts.user_id, req.user!.id));

  return sendResult(res, {
    http_status: 200,
    status: 1,
    message: "OK",
    data: rows,
  });
});

// --- 2FA management (authenticated) ---

router.get("/2fa/status", userAuth, async (req, res) => {
  return sendResult(res, await TfaService.getStatus(req.user!.id));
});

router.post("/2fa/enable", userAuth, async (req, res) => {
  const validated = validateData(tfaEnableSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  return sendResult(
    res,
    await TfaService.enable(req, req.user!.id, validated.data.password),
  );
});

router.post("/2fa/disable", userAuth, async (req, res) => {
  const validated = validateData(tfaDisableSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const clientInfo = getClientInfo(req);
  return sendResult(
    res,
    await TfaService.disable(req.user!.id, validated.data.password, clientInfo),
  );
});

router.post("/2fa/verify-setup", userAuth, async (req, res) => {
  const validated = validateData(tfaVerifySetupSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  const clientInfo = getClientInfo(req);
  return sendResult(
    res,
    await TfaService.verifySetup(
      req.user!.id,
      validated.data.code,
      clientInfo,
      validated.data.method,
    ),
  );
});

router.post("/2fa/backup-codes", userAuth, async (req, res) => {
  const validated = validateData(tfaBackupCodesSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const clientInfo = getClientInfo(req);
  return sendResult(
    res,
    await TfaService.regenerateBackupCodes(
      clientInfo,
      req.user!.id,
      validated.data.password,
    ),
  );
});

router.post("/2fa/remove-authenticator", userAuth, async (req, res) => {
  const clientInfo = getClientInfo(req);
  return sendResult(
    res,
    await TfaService.removeAuthenticator(req.user!.id, clientInfo),
  );
});

// --- Passkey management (authenticated) ---

router.get("/passkey/list", userAuth, async (req, res) => {
  return sendResult(
    res,
    await PasskeyService.list(req.user!.id, getClientTimezone(req)),
  );
});

router.post("/passkey/delete", userAuth, async (req, res) => {
  if (!req.body.id) return sendError(res, 422, "Passkey ID is required");
  const clientInfo = getClientInfo(req);
  return sendResult(
    res,
    await PasskeyService.remove(clientInfo, req.user!.id, req.body.id),
  );
});

router.post("/passkey/register-options", userAuth, async (req, res) => {
  const result = await PasskeyService.registerOptions(req, req.user!.id);

  if (result.status === 1 && result.data?.challengeHandle) {
    setWebAuthnChallengeCookie(res, result.data.challengeHandle);
    delete result.data.challengeHandle;
  }
  return sendResult(res, result);
});

router.post("/passkey/register-verify", userAuth, async (req, res) => {
  const challengeHandle = getWebAuthnChallengeHandle(req);
  if (!challengeHandle) return sendError(res, 400, "No challenge found");

  const clientInfo = getClientInfo(req);
  const result = await PasskeyService.registerVerify(
    req,
    req.user!.id,
    req.body.response,
    challengeHandle,
    clientInfo,
    req.body.name,
  );

  clearWebAuthnChallengeCookie(res);
  return sendResult(res, result);
});

export default router;

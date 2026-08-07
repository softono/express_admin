import { createHmac, timingSafeEqual } from "crypto";
import type { CookieOptions, Request, Response } from "express";
import config from "@/config";

const IS_PROD = config.APP_ENV === "production";
const APP_UID = config.APP_UID;
const SECRET = config.ENCRYPTION_KEY;

const COOKIE_OPTS: CookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: IS_PROD,
};

export const COOKIE_NAMES = {
  SESSION: `${APP_UID}_session_token`,
  DEVICE_UID: `${APP_UID}_device_uid`,
  TFA_CHALLENGE: `${APP_UID}_tfa`,
  WEBAUTHN_CHALLENGE: `${APP_UID}_wac`,
} as const;

// --- Device UID ---

export function getDeviceUid(req: Request): string {
  return req.cookies?.[COOKIE_NAMES.DEVICE_UID] ?? "";
}

export function setDeviceCookie(res: Response, uid: string) {
  res.cookie(COOKIE_NAMES.DEVICE_UID, uid, {
    ...COOKIE_OPTS,
    maxAge: 31536000 * 1000,
  });
}

// --- Session cookie ---

export function getSessionToken(req: Request): string {
  return req.cookies?.[COOKIE_NAMES.SESSION] ?? "";
}

export function setSessionCookie(
  res: Response,
  token: string,
  options: { remember?: boolean } = {},
) {
  const maxAge = (options.remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60) * 1000;
  res.cookie(COOKIE_NAMES.SESSION, token, { ...COOKIE_OPTS, maxAge });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAMES.SESSION, COOKIE_OPTS);
}

// --- Signed short-lived cookies (2FA challenge, WebAuthn, OAuth state) ---

function sign(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifySignature(cookie: string): string | null {
  const idx = cookie.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = cookie.slice(0, idx);
  const sig = cookie.slice(idx + 1);
  const expected = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  return payload;
}

// --- 2FA challenge cookie ---

export function setTfaChallengeCookie(res: Response, handle: string) {
  res.cookie(COOKIE_NAMES.TFA_CHALLENGE, sign(handle), {
    ...COOKIE_OPTS,
    maxAge: 600 * 1000,
  });
}

export function getTfaChallengeHandle(req: Request): string | null {
  const cookie = req.cookies?.[COOKIE_NAMES.TFA_CHALLENGE] ?? "";
  if (!cookie) return null;
  return verifySignature(cookie);
}

export function clearTfaChallengeCookie(res: Response) {
  res.clearCookie(COOKIE_NAMES.TFA_CHALLENGE, COOKIE_OPTS);
}

// --- WebAuthn challenge cookie ---

export function setWebAuthnChallengeCookie(res: Response, handle: string) {
  res.cookie(COOKIE_NAMES.WEBAUTHN_CHALLENGE, sign(handle), {
    ...COOKIE_OPTS,
    maxAge: 300 * 1000,
  });
}

export function getWebAuthnChallengeHandle(req: Request): string | null {
  const cookie = req.cookies?.[COOKIE_NAMES.WEBAUTHN_CHALLENGE] ?? "";
  if (!cookie) return null;
  return verifySignature(cookie);
}

export function clearWebAuthnChallengeCookie(res: Response) {
  res.clearCookie(COOKIE_NAMES.WEBAUTHN_CHALLENGE, COOKIE_OPTS);
}

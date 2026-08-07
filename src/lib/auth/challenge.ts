import { randomBytes } from "crypto";
import { setCache, getCache, deleteCache, incrCache } from "@/lib/cache";

const TFA_TTL = 600; // 10 min
const WEBAUTHN_TTL = 300; // 5 min
const TFA_MAX_ATTEMPTS = 5;

// --- tfa pending challenge ---

export interface TfaPending {
  userId: string;
  remember: boolean;
}

function tfaKey(handle: string) {
  return `auth:tfa:${handle}`;
}

export async function createTfaChallenge(
  userId: string,
  remember: boolean,
): Promise<string> {
  const handle = randomBytes(32).toString("base64url");
  await setCache(tfaKey(handle), JSON.stringify({ userId, remember }), TFA_TTL);
  return handle;
}

export async function consumeTfaChallenge(
  handle: string,
): Promise<TfaPending | null> {
  const raw = await getCache(tfaKey(handle));
  if (!raw) return null;
  await deleteCache(tfaKey(handle));
  await deleteCache(tfaAttemptsKey(handle));
  return JSON.parse(raw) as TfaPending;
}

export async function peekTfaChallenge(
  handle: string,
): Promise<TfaPending | null> {
  const raw = await getCache(tfaKey(handle));
  if (!raw) return null;
  return JSON.parse(raw) as TfaPending;
}

function tfaAttemptsKey(handle: string) {
  return `auth:tfa:attempts:${handle}`;
}

// Record a failed verification attempt. Returns true if the attempt cap has
// been reached, in which case the caller should destroy the challenge.
export async function bumpTfaAttempts(handle: string): Promise<boolean> {
  const { count } = await incrCache(tfaAttemptsKey(handle), TFA_TTL);
  return count >= TFA_MAX_ATTEMPTS;
}

export async function clearTfaAttempts(handle: string): Promise<void> {
  await deleteCache(tfaAttemptsKey(handle));
}

// --- email change challenge ---

export interface EmailChangePending {
  userId: string;
  newEmail: string;
  newEmailVerified: boolean;
}

function emailChangeKey(handle: string) {
  return `account:email-change:${handle}`;
}

function emailChangeAttemptsKey(handle: string) {
  return `account:email-change:attempts:${handle}`;
}

export async function createEmailChangeChallenge(
  userId: string,
  newEmail: string,
): Promise<string> {
  const handle = randomBytes(32).toString("base64url");
  await setCache(
    emailChangeKey(handle),
    JSON.stringify({ userId, newEmail, newEmailVerified: false }),
    TFA_TTL,
  );
  return handle;
}

export async function peekEmailChangeChallenge(
  handle: string,
): Promise<EmailChangePending | null> {
  const raw = await getCache(emailChangeKey(handle));
  if (!raw) return null;
  return JSON.parse(raw) as EmailChangePending;
}

export async function markEmailChangeVerified(
  pending: EmailChangePending,
  handle: string,
): Promise<void> {
  await setCache(
    emailChangeKey(handle),
    JSON.stringify({ ...pending, newEmailVerified: true }),
    TFA_TTL,
  );
}

export async function consumeEmailChangeChallenge(
  handle: string,
): Promise<EmailChangePending | null> {
  const raw = await getCache(emailChangeKey(handle));
  if (!raw) return null;
  await deleteCache(emailChangeKey(handle));
  await deleteCache(emailChangeAttemptsKey(handle));
  return JSON.parse(raw) as EmailChangePending;
}

// Record a failed verification attempt (shared across both stages). Returns
// true if the attempt cap has been reached, in which case the caller should
// destroy the challenge.
export async function bumpEmailChangeAttempts(
  handle: string,
): Promise<boolean> {
  const { count } = await incrCache(emailChangeAttemptsKey(handle), TFA_TTL);
  return count >= TFA_MAX_ATTEMPTS;
}

// --- WebAuthn challenge ---

function webauthnKey(handle: string) {
  return `webauthn:chal:${handle}`;
}

export async function createWebAuthnChallenge(
  challenge: string,
): Promise<string> {
  const handle = randomBytes(32).toString("base64url");
  await setCache(webauthnKey(handle), challenge, WEBAUTHN_TTL);
  return handle;
}

export async function consumeWebAuthnChallenge(
  handle: string,
): Promise<string | null> {
  const challenge = await getCache(webauthnKey(handle));
  if (!challenge) return null;
  await deleteCache(webauthnKey(handle));
  return challenge;
}

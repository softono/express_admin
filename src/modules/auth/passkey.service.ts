import type { Request } from "express";
import {
  genRegistrationOptions,
  verifyRegistration,
  genAuthenticationOptions,
  verifyAuthentication,
  createWebAuthnChallenge,
  consumeWebAuthnChallenge,
  issueSession,
} from "@/lib/auth";
import { logActivity } from "@/modules/account/user-activity.service";
import { getUserById } from "@/modules/account/user.service";
import type { ApiResult } from "@/types";
import { toSafeUser } from "@/modules/account/user.service";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { USER_STATUS } from "@/modules/account/user.constants";
import {
  findPasskeysByUser,
  listPasskeysByUser,
  insertPasskey,
  findPasskeyByCredentialId,
  findPasskeyById,
  updatePasskeyCounter,
  deletePasskeyById,
} from "@/models/user-passkey.repository";
import { type ClientInfo } from "@/utils/clientInfo";
import { dateTimeFormat } from "@/lib/date";

export async function registerOptions(
  req: Request,
  userId: string,
): Promise<ApiResult> {
  const user = await getUserById(userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  const existing = await findPasskeysByUser(userId);

  const options = await genRegistrationOptions(userId, user.email, existing);

  const handle = await createWebAuthnChallenge(options.challenge);

  return {
    http_status: 200,
    status: 1,
    message: "ok",
    data: { options, challengeHandle: handle },
  };
}

export async function registerVerify(
  req: Request,
  userId: string,
  response: RegistrationResponseJSON,
  challengeHandle: string,
  clientInfo: ClientInfo,
  name?: string,
): Promise<ApiResult> {
  const challenge = await consumeWebAuthnChallenge(challengeHandle);
  if (!challenge) {
    return { http_status: 400, status: 0, message: "Challenge expired" };
  }

  const verification = await verifyRegistration(response, challenge);
  if (!verification.verified || !verification.registrationInfo) {
    return { http_status: 400, status: 0, message: "Verification failed" };
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  await insertPasskey({
    name: name || null,
    public_key: Buffer.from(credential.publicKey).toString("base64url"),
    user_id: userId,
    credential_id: credential.id,
    counter: credential.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: credential.transports?.join(",") || null,
    created_at: new Date(),
  });

  await logActivity("PASSKEY_ADDED", userId, clientInfo);

  return { http_status: 200, status: 1, message: "Passkey registered" };
}

export async function loginOptions(): Promise<ApiResult> {
  const options = await genAuthenticationOptions();
  const handle = await createWebAuthnChallenge(options.challenge);

  return {
    http_status: 200,
    status: 1,
    message: "ok",
    data: { options, challengeHandle: handle },
  };
}

export async function loginVerify(
  req: Request,
  response: AuthenticationResponseJSON,
  challengeHandle: string,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const challenge = await consumeWebAuthnChallenge(challengeHandle);
  if (!challenge) {
    return { http_status: 400, status: 0, message: "Challenge expired" };
  }

  const pk = await findPasskeyByCredentialId(response.id);

  if (!pk) {
    return { http_status: 401, status: 0, message: "Passkey not found" };
  }

  const publicKey = new Uint8Array(
    Buffer.from(pk.public_key, "base64url"),
  ) as Uint8Array<ArrayBuffer>;

  const verification = await verifyAuthentication(
    response,
    challenge,
    publicKey,
    pk.counter,
  );

  if (!verification.verified) {
    return { http_status: 401, status: 0, message: "Verification failed" };
  }

  await updatePasskeyCounter(pk.id, verification.authenticationInfo.newCounter);

  const user = await getUserById(pk.user_id);
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    return { http_status: 403, status: 0, message: "Account disabled" };
  }

  const { token } = await issueSession(req, user.id, { remember: true });
  await logActivity("LOGIN_SUCCESS", user.id, clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Login successful",
    data: { token, user: toSafeUser(user) },
  };
}

export async function list(userId: string, tz: string): Promise<ApiResult> {
  const rows = await listPasskeysByUser(userId);

  return {
    http_status: 200,
    status: 1,
    message: "ok",
    data: rows.map((row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    })),
  };
}

export async function remove(
  clientInfo: ClientInfo,
  userId: string,
  passkeyId: string,
): Promise<ApiResult> {
  const pk = await findPasskeyById(passkeyId);

  if (!pk || pk.user_id !== userId) {
    return { http_status: 404, status: 0, message: "Passkey not found" };
  }

  await deletePasskeyById(passkeyId);
  await logActivity("PASSKEY_DELETED", userId, clientInfo);

  return { http_status: 200, status: 1, message: "Passkey deleted" };
}

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import config from "@/config";

const APP_URL = config.WEBAUTHN_ORIGIN || config.APP_URL;

function getRpId(): string {
  return new URL(APP_URL).hostname;
}

function getOrigin(): string {
  return APP_URL;
}

function getRpName(): string {
  return config.APP_NAME;
}

export interface UserPasskeyDescriptor {
  credential_id: string;
  transports?: string | null;
}

export async function genRegistrationOptions(
  userId: string,
  userName: string,
  existingPasskeys: UserPasskeyDescriptor[],
) {
  return generateRegistrationOptions({
    rpName: getRpName(),
    rpID: getRpId(),
    userID: new TextEncoder().encode(userId),
    userName,
    attestationType: "none",
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credential_id,
      transports: pk.transports
        ? (pk.transports.split(",") as AuthenticatorTransportFuture[])
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
}

export async function verifyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
): Promise<VerifiedRegistrationResponse> {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpId(),
  });
}

export async function genAuthenticationOptions() {
  return generateAuthenticationOptions({
    rpID: getRpId(),
    userVerification: "preferred",
  });
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credentialPublicKey: Uint8Array<ArrayBuffer>,
  credentialCurrentCounter: number,
): Promise<VerifiedAuthenticationResponse> {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpId(),
    credential: {
      id: response.id,
      publicKey: credentialPublicKey,
      counter: credentialCurrentCounter,
    },
  });
}

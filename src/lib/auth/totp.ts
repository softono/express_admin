import { generateSecret, generateURI, verify as otplibVerify } from "otplib";
import { hashPassword, checkPassword } from "./password";
import { encrypt, decrypt } from "../encryption";
import { randomBytes } from "crypto";
import config from "@/config";

export function generateTotpSecret(): string {
  return encrypt(generateSecret());
}

export function getTotpKeyUri(
  encryptedSecret: string,
  email: string,
  issuer?: string,
): string {
  return generateURI({
    issuer: issuer || config.APP_NAME,
    label: email,
    secret: decrypt(encryptedSecret),
  });
}

export async function verifyTotp(
  token: string,
  encryptedSecret: string,
): Promise<boolean> {
  const result = await otplibVerify({
    token,
    secret: decrypt(encryptedSecret),
  });
  return result.valid;
}

const BACKUP_CODE_COUNT = 10;

export async function generateBackupCodes(): Promise<{
  plain: string[];
  hashed: string[];
}> {
  const plain: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    plain.push(code);
    hashed.push(await hashPassword(code));
  }
  return { plain, hashed };
}

export async function verifyBackupCode(
  code: string,
  hashedCodes: string[],
): Promise<{ valid: boolean; remaining: string[] }> {
  const upperCode = code.toUpperCase();
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await checkPassword(hashedCodes[i], upperCode)) {
      const remaining = [...hashedCodes];
      remaining.splice(i, 1);
      return { valid: true, remaining };
    }
  }
  return { valid: false, remaining: hashedCodes };
}

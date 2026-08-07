// Server-safe random alphanumeric generator
import { randomBytes } from "crypto";

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function randomAlnum(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => ALNUM[b % ALNUM.length])
    .join("");
}

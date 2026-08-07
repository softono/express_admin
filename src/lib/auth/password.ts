import argon2 from "argon2";

const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+daw";

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function checkPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function dummyPasswordCheck(): Promise<void> {
  await argon2.verify(DUMMY_HASH, "dummy").catch(() => {});
}

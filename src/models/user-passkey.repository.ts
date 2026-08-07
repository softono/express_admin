import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { userPasskeys, type IUserPasskey } from "@/models/user-passkey";

export async function findPasskeysByUser(
  userId: string,
): Promise<Pick<IUserPasskey, "credential_id" | "transports">[]> {
  return db
    .select({
      credential_id: userPasskeys.credential_id,
      transports: userPasskeys.transports,
    })
    .from(userPasskeys)
    .where(eq(userPasskeys.user_id, userId));
}

export async function listPasskeysByUser(userId: string) {
  return db
    .select({
      id: userPasskeys.id,
      name: userPasskeys.name,
      credential_id: userPasskeys.credential_id,
      device_type: userPasskeys.device_type,
      backed_up: userPasskeys.backed_up,
      created_at: userPasskeys.created_at,
    })
    .from(userPasskeys)
    .where(eq(userPasskeys.user_id, userId));
}

export async function insertPasskey(
  values: typeof userPasskeys.$inferInsert,
): Promise<void> {
  await db.insert(userPasskeys).values(values);
}

export async function findPasskeyByCredentialId(
  credentialId: string,
): Promise<IUserPasskey | null> {
  const [row] = await db
    .select()
    .from(userPasskeys)
    .where(eq(userPasskeys.credential_id, credentialId))
    .limit(1);
  return row ?? null;
}

export async function findPasskeyById(
  id: string,
): Promise<IUserPasskey | null> {
  const [row] = await db
    .select()
    .from(userPasskeys)
    .where(eq(userPasskeys.id, id))
    .limit(1);
  return row ?? null;
}

export async function updatePasskeyCounter(
  id: string,
  counter: number,
): Promise<void> {
  await db.update(userPasskeys).set({ counter }).where(eq(userPasskeys.id, id));
}

export async function deletePasskeyById(id: string): Promise<void> {
  await db.delete(userPasskeys).where(eq(userPasskeys.id, id));
}

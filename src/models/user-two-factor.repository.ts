import { eq } from "drizzle-orm";
import db from "@/lib/db";
import {
  userTwoFactors,
  type IUserTwoFactor,
} from "@/models/user-two-factor";

export async function findTwoFactorByUser(
  userId: string,
): Promise<IUserTwoFactor | null> {
  const [row] = await db
    .select()
    .from(userTwoFactors)
    .where(eq(userTwoFactors.user_id, userId))
    .limit(1);
  return row ?? null;
}

export async function updateTwoFactor(
  id: string,
  values: Partial<typeof userTwoFactors.$inferInsert>,
): Promise<void> {
  await db.update(userTwoFactors).set(values).where(eq(userTwoFactors.id, id));
}

export async function insertTwoFactor(
  values: typeof userTwoFactors.$inferInsert,
): Promise<void> {
  await db.insert(userTwoFactors).values(values);
}

export async function deleteTwoFactorByUser(userId: string): Promise<void> {
  await db.delete(userTwoFactors).where(eq(userTwoFactors.user_id, userId));
}

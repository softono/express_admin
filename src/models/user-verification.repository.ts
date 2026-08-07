import { eq, and, gt, sql } from "drizzle-orm";
import db from "@/lib/db";
import {
  verifications,
  type IVerification,
} from "@/models/user-verification";

export async function deleteVerificationByIdentifier(
  identifier: string,
): Promise<void> {
  await db
    .delete(verifications)
    .where(eq(verifications.identifier, identifier));
}

export async function insertVerification(
  values: typeof verifications.$inferInsert,
): Promise<void> {
  await db.insert(verifications).values(values);
}

export async function findActiveVerificationByIdentifier(
  identifier: string,
): Promise<IVerification | null> {
  const [row] = await db
    .select()
    .from(verifications)
    .where(
      and(
        eq(verifications.identifier, identifier),
        gt(verifications.expires_at, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function incrementVerificationAttempts(
  id: string,
): Promise<{ attempts: number } | null> {
  const [row] = await db
    .update(verifications)
    .set({ attempts: sql`${verifications.attempts} + 1` })
    .where(eq(verifications.id, id))
    .returning({ attempts: verifications.attempts });
  return row ?? null;
}

export async function deleteVerificationById(id: string): Promise<void> {
  await db.delete(verifications).where(eq(verifications.id, id));
}

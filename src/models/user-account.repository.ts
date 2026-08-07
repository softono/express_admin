import { eq, and } from "drizzle-orm";
import db from "@/lib/db";
import { userAccounts, type IUserAccount } from "@/models/user-account";

export async function findCredentialAccountByUserId(
  userId: string,
): Promise<Pick<IUserAccount, "id" | "password"> | null> {
  const [row] = await db
    .select({ id: userAccounts.id, password: userAccounts.password })
    .from(userAccounts)
    .where(
      and(
        eq(userAccounts.user_id, userId),
        eq(userAccounts.provider_id, "credential"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findAccountByProvider(
  providerId: string,
  accountId: string,
): Promise<IUserAccount | null> {
  const [row] = await db
    .select()
    .from(userAccounts)
    .where(
      and(
        eq(userAccounts.provider_id, providerId),
        eq(userAccounts.account_id, accountId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function insertUserAccount(
  values: typeof userAccounts.$inferInsert,
): Promise<IUserAccount> {
  const [row] = await db.insert(userAccounts).values(values).returning();
  return row;
}

export async function updateUserAccountPassword(
  id: string,
  password: string,
): Promise<void> {
  await db
    .update(userAccounts)
    .set({ password, updated_at: new Date() })
    .where(eq(userAccounts.id, id));
}

export async function updateUserAccountTimestamp(id: string): Promise<void> {
  await db
    .update(userAccounts)
    .set({ updated_at: new Date() })
    .where(eq(userAccounts.id, id));
}

export async function updateCredentialPasswordByUserId(
  userId: string,
  password: string,
): Promise<void> {
  await db
    .update(userAccounts)
    .set({ password, updated_at: new Date() })
    .where(
      and(
        eq(userAccounts.user_id, userId),
        eq(userAccounts.provider_id, "credential"),
      ),
    );
}

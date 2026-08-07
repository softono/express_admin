import { and, desc, eq, ne } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import db from "@/lib/db";
import { userSessions, type IUserSession } from "@/models/user-session";
import { users, type IUser } from "@/models/user";

export const sessionSortMap: Record<string, PgColumn> = {
  device_uid: userSessions.device_uid,
  user_agent: userSessions.user_agent,
  ip_address: userSessions.ip_address,
  created_at: userSessions.created_at,
};

export async function findSessionByToken(
  token: string,
): Promise<IUserSession | null> {
  const [row] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.token, token))
    .limit(1);
  return row ?? null;
}

/** Session + owning user, joined in one query (primary table = userSessions). */
export async function findSessionWithUserByToken(
  token: string,
): Promise<{ session: IUserSession; user: IUser } | null> {
  const [row] = await db
    .select({ session: userSessions, user: users })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.user_id, users.id))
    .where(eq(userSessions.token, token))
    .limit(1);
  return row ?? null;
}

export async function insertSession(
  values: Omit<typeof userSessions.$inferInsert, "id">,
): Promise<IUserSession> {
  const [row] = await db.insert(userSessions).values(values).returning();
  return row;
}

export async function updateSessionExpiry(
  id: string,
  expiresAt: Date,
  updatedAt: Date,
): Promise<void> {
  await db
    .update(userSessions)
    .set({ expires_at: expiresAt, updated_at: updatedAt })
    .where(eq(userSessions.id, id));
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.token, token));
}

export async function findSessionTokensByUser(
  userId: string,
): Promise<{ token: string }[]> {
  return db
    .select({ token: userSessions.token })
    .from(userSessions)
    .where(eq(userSessions.user_id, userId));
}

export async function deleteSessionsByUser(userId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.user_id, userId));
}

/** Delete all sessions for a user, optionally keeping one token; returns deleted rows. */
export async function deleteSessionsByUserExceptToken(
  userId: string,
  keepToken?: string,
): Promise<{ id: string; token: string }[]> {
  const conditions = [eq(userSessions.user_id, userId)];
  if (keepToken) conditions.push(ne(userSessions.token, keepToken));

  return db
    .delete(userSessions)
    .where(and(...conditions))
    .returning({ id: userSessions.id, token: userSessions.token });
}

export async function deleteSessionByIdAndUser(
  sessionId: string,
  userId: string,
): Promise<IUserSession | null> {
  const [row] = await db
    .delete(userSessions)
    .where(
      and(eq(userSessions.id, sessionId), eq(userSessions.user_id, userId)),
    )
    .returning();
  return row ?? null;
}

export async function deleteSessionById(
  sessionId: string,
): Promise<IUserSession | null> {
  const [row] = await db
    .delete(userSessions)
    .where(eq(userSessions.id, sessionId))
    .returning();
  return row ?? null;
}

export function listSessionsByUser(userId: string) {
  return db
    .select()
    .from(userSessions)
    .where(eq(userSessions.user_id, userId))
    .$dynamic();
}

export async function listSessionsByUserForAdmin(userId: string) {
  return db
    .select({
      id: userSessions.id,
      device_uid: userSessions.device_uid,
      user_agent: userSessions.user_agent,
      ip_address: userSessions.ip_address,
      created_at: userSessions.created_at,
      expires_at: userSessions.expires_at,
    })
    .from(userSessions)
    .where(eq(userSessions.user_id, userId))
    .orderBy(desc(userSessions.updated_at));
}

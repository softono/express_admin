import { eq } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import db from "@/lib/db";
import { userActivities } from "@/models/user-activity";

export const userActivitySortMap: Record<string, PgColumn> = {
  type: userActivities.type,
  ip: userActivities.ip,
  client: userActivities.client,
  created_at: userActivities.created_at,
};

export async function insertUserActivity(
  values: typeof userActivities.$inferInsert,
) {
  const [row] = await db.insert(userActivities).values(values).returning();
  return row;
}

export function listUserActivity(userId: string) {
  return db
    .select()
    .from(userActivities)
    .where(eq(userActivities.user_id, userId))
    .$dynamic();
}

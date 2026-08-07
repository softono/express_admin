import { and, eq } from "drizzle-orm";
import db from "@/lib/db";
import { contactMessages, type IContactMessages } from "@/models/schema";

export async function findDuplicateContactMessage(
  toUser: string,
  subject: string,
  message: string,
): Promise<IContactMessages | null> {
  const rows = await db
    .select()
    .from(contactMessages)
    .where(
      and(
        eq(contactMessages.to_user, toUser),
        eq(contactMessages.subject, subject),
        eq(contactMessages.message, message),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createContactMessage(data: {
  user_id?: string | null;
  to_user: string;
  subject: string;
  message: string;
}): Promise<IContactMessages> {
  const [row] = await db.insert(contactMessages).values(data).returning();
  return row;
}

export const contactMessageSortMap = {
  to_user: contactMessages.to_user,
  subject: contactMessages.subject,
  created_at: contactMessages.created_at,
};

export function listContactMessages(userId: string) {
  return db
    .select({
      id: contactMessages.id,
      to_user: contactMessages.to_user,
      subject: contactMessages.subject,
      message: contactMessages.message,
      created_at: contactMessages.created_at,
    })
    .from(contactMessages)
    .where(eq(contactMessages.user_id, userId))
    .$dynamic();
}

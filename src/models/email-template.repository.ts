import { eq, ilike, or, type SQL } from "drizzle-orm";
import db from "@/lib/db";
import { emailTemplates, type IEmailTemplate } from "@/models/schema";

export const emailTemplateSortMap = {
  title: emailTemplates.title,
  subject: emailTemplates.subject,
  created_at: emailTemplates.created_at,
};

export function listAdminEmailTemplates(where?: SQL) {
  return db
    .select({
      id: emailTemplates.id,
      key: emailTemplates.key,
      title: emailTemplates.title,
      subject: emailTemplates.subject,
      created_at: emailTemplates.created_at,
    })
    .from(emailTemplates)
    .where(where)
    .$dynamic();
}

export function buildEmailTemplateSearch(search: string): SQL | undefined {
  if (search.length <= 2) return undefined;
  const like = `%${search}%`;
  return or(
    ilike(emailTemplates.title, like),
    ilike(emailTemplates.subject, like),
    ilike(emailTemplates.key, like),
  );
}

export async function findEmailTemplateById(
  id: number,
): Promise<Pick<
  IEmailTemplate,
  | "id"
  | "key"
  | "title"
  | "subject"
  | "body"
  | "params"
  | "created_at"
  | "updated_at"
> | null> {
  const rows = await db
    .select({
      id: emailTemplates.id,
      key: emailTemplates.key,
      title: emailTemplates.title,
      subject: emailTemplates.subject,
      body: emailTemplates.body,
      params: emailTemplates.params,
      created_at: emailTemplates.created_at,
      updated_at: emailTemplates.updated_at,
    })
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateEmailTemplateById(
  id: number,
  data: Record<string, unknown>,
): Promise<IEmailTemplate | null> {
  const [row] = await db
    .update(emailTemplates)
    .set(data)
    .where(eq(emailTemplates.id, id))
    .returning();
  return row ?? null;
}

export async function findEmailTemplateByKey(
  key: string,
): Promise<IEmailTemplate | null> {
  const rows = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, key))
    .limit(1);
  return rows[0] ?? null;
}

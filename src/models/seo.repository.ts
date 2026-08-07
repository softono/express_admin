import { and, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import db from "@/lib/db";
import { seos, type ISeo } from "@/models/schema";

export const seoSortMap = {
  url: seos.url,
  title: seos.title,
  keyword: seos.keyword,
  sitemap_enable: seos.status,
  created_at: seos.created_at,
};

export function listAdminSeo(where?: SQL) {
  return db
    .select({
      id: seos.id,
      url: seos.url,
      title: seos.title,
      keyword: seos.keyword,
      status: seos.status,
      created_at: seos.created_at,
    })
    .from(seos)
    .where(where)
    .$dynamic();
}

export function buildSeoSearch(search: string): SQL | undefined {
  if (search.length <= 2) return undefined;
  const like = `%${search}%`;
  return or(
    ilike(seos.url, like),
    ilike(seos.title, like),
    ilike(seos.keyword, like),
  );
}

export async function findSeoById(
  id: number,
): Promise<Pick<
  ISeo,
  | "id"
  | "type"
  | "url"
  | "title"
  | "keyword"
  | "description"
  | "last_modified"
  | "change_frequency"
  | "priority"
  | "status"
  | "created_at"
  | "updated_at"
> | null> {
  const rows = await db
    .select({
      id: seos.id,
      type: seos.type,
      url: seos.url,
      title: seos.title,
      keyword: seos.keyword,
      description: seos.description,
      last_modified: seos.last_modified,
      change_frequency: seos.change_frequency,
      priority: seos.priority,
      status: seos.status,
      created_at: seos.created_at,
      updated_at: seos.updated_at,
    })
    .from(seos)
    .where(eq(seos.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSeo(
  data: Partial<ISeo> & { url: string },
): Promise<ISeo> {
  const [row] = await db
    .insert(seos)
    .values(data as typeof seos.$inferInsert)
    .returning();
  return row;
}

export async function updateSeo(
  id: number,
  data: Record<string, unknown>,
): Promise<ISeo | null> {
  const [row] = await db
    .update(seos)
    .set(data)
    .where(eq(seos.id, id))
    .returning();
  return row ?? null;
}

export async function deleteSeo(id: number): Promise<ISeo | null> {
  const [row] = await db.delete(seos).where(eq(seos.id, id)).returning();
  return row ?? null;
}

export async function findAllEnabledSeo(): Promise<ISeo[]> {
  return db.select().from(seos).where(eq(seos.status, 1));
}

export async function findSeoByUrlCandidates(
  candidates: string[],
): Promise<ISeo | null> {
  const rows = await db
    .select()
    .from(seos)
    .where(and(inArray(seos.url, candidates), eq(seos.status, 1)))
    .limit(1);
  return rows[0] ?? null;
}

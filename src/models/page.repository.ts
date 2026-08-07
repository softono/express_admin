import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import db from "@/lib/db";
import { pages, type IPage } from "@/models/schema";
import { USER_STATUS } from "@/modules/account/user.constants";

export const pageSortMap = {
  title: pages.title,
  slug: pages.slug,
  created_at: pages.created_at,
};

export function listAdmin(where?: SQL) {
  return db
    .select({
      id: pages.id,
      slug: pages.slug,
      title: pages.title,
      status: pages.status,
      created_at: pages.created_at,
    })
    .from(pages)
    .where(where)
    .$dynamic();
}

export function buildPagesSearch(search: string): SQL | undefined {
  if (search.length <= 2) return undefined;
  const like = `%${search}%`;
  return or(ilike(pages.title, like), ilike(pages.slug, like));
}

export async function findPageById(id: number): Promise<IPage | null> {
  const rows = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updatePage(
  id: number,
  data: { title?: string; slug?: string; body?: string; updated_at: Date },
): Promise<IPage | null> {
  const [row] = await db
    .update(pages)
    .set(data)
    .where(eq(pages.id, id))
    .returning();
  return row ?? null;
}

export async function findActivePageBySlug(
  slug: string,
): Promise<IPage | null> {
  const rows = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.status, USER_STATUS.ACTIVE)))
    .limit(1);
  return rows[0] ?? null;
}

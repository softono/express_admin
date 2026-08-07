import { and, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import db from "@/lib/db";
import { blogs, type IBlog, type NewBlog } from "@/models/schema";
import { USER_STATUS } from "@/modules/account/user.constants";

export const blogSortMap = {
  title: blogs.title,
  slug: blogs.slug,
  category: blogs.category,
  status: blogs.status,
  created_at: blogs.created_at,
};

export function listPublicBlog(filters: {
  search?: string;
  category?: string[];
}) {
  const conditions: SQL[] = [eq(blogs.status, USER_STATUS.ACTIVE)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(blogs.title, term), ilike(blogs.excerpt, term))!);
  }

  if (filters.category?.length) {
    conditions.push(inArray(blogs.category, filters.category));
  }

  return db
    .select({
      id: blogs.id,
      slug: blogs.slug,
      title: blogs.title,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      created_at: blogs.created_at,
    })
    .from(blogs)
    .where(and(...conditions))
    .$dynamic();
}

export async function findActiveBlogBySlug(
  slug: string,
): Promise<IBlog | null> {
  const rows = await db
    .select()
    .from(blogs)
    .where(and(eq(blogs.slug, slug), eq(blogs.status, USER_STATUS.ACTIVE)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findBlogById(id: number): Promise<IBlog | null> {
  const rows = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createBlog(data: NewBlog): Promise<IBlog> {
  const [row] = await db.insert(blogs).values(data).returning();
  return row;
}

export async function updateBlog(
  id: number,
  data: Partial<NewBlog>,
): Promise<IBlog | null> {
  const [row] = await db
    .update(blogs)
    .set(data)
    .where(eq(blogs.id, id))
    .returning();
  return row ?? null;
}

export async function deleteBlog(id: number): Promise<IBlog | null> {
  const [row] = await db.delete(blogs).where(eq(blogs.id, id)).returning();
  return row ?? null;
}

export function listAdminBlog(where?: SQL) {
  return db
    .select({
      id: blogs.id,
      slug: blogs.slug,
      title: blogs.title,
      category: blogs.category,
      image: blogs.image,
      status: blogs.status,
      created_at: blogs.created_at,
    })
    .from(blogs)
    .where(where)
    .$dynamic();
}

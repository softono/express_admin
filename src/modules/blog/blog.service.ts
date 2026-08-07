import { and, or, ilike } from "drizzle-orm";
import { blogs } from "@/models/schema";
import { paginate } from "@/lib/pagination";

import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/lib/pagination/pagination.validator";
import {
  buildFilter,
  type FilterMap,
} from "@/lib/pagination/buildFilter";
import { dateTimeFormat } from "@/lib/date";
import { getFileUrl } from "@/lib/file";
import type { BlogSaveInput } from "@/modules/blog/blog.validator";
import type { Blog } from "@/modules/blog/blog.types";
import type { NewBlog } from "@/models/schema";
import {
  createBlog,
  updateBlog,
  findBlogById,
  listAdminBlog,
  deleteBlog,
  blogSortMap,
} from "@/models/blog.repository";

/* ---------------- FILTER MAP ---------------- */
const blogFilterMap: FilterMap = {
  title: { column: blogs.title, type: "text" },
  slug: { column: blogs.slug, type: "text" },
  category: { column: blogs.category, type: "text" },
  status: { column: blogs.status, type: "select" },
  created_at: { column: blogs.created_at, type: "date" },
};

function toBlog(row: typeof blogs.$inferSelect, tz: string): Blog {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category ?? "",
    image: getFileUrl(row.image, "images"),
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    status: row.status as Blog["status"],
    created_at: dateTimeFormat(row.created_at, tz),
    updated_at: dateTimeFormat(row.updated_at, tz),
  };
}

function toPayload(data: Partial<BlogSaveInput>): Record<string, unknown> {
  const { image, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest, updated_at: new Date() };
  if (image) payload.image = image;
  return payload;
}

/* ---------------- CREATE BLOG ---------------- */
export async function createAdminBlog(
  data: BlogSaveInput,
  tz: string,
): Promise<Blog> {
  const payload = toPayload(data);
  payload.created_at = new Date();

  const row = await createBlog(payload as NewBlog);
  return toBlog(row, tz);
}

/* ---------------- UPDATE BLOG ---------------- */
export async function updateAdminBlog(
  id: number,
  data: Partial<BlogSaveInput>,
  tz: string,
): Promise<Blog | null> {
  const row = await updateBlog(id, toPayload(data));
  return row ? toBlog(row, tz) : null;
}

/* ---------------- GET BLOG BY ID ---------------- */
export async function getAdminBlogById(
  id: string,
  tz: string,
): Promise<Blog | null> {
  const row = await findBlogById(Number(id));

  return row ? toBlog(row, tz) : null;
}

/* ---------------- LIST BLOGS ---------------- */
export async function listBlogs(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();

  const conditions: ReturnType<typeof ilike>[] = [];

  if (search.length > 2) {
    const like = `%${search}%`;

    conditions.push(
      or(
        ilike(blogs.title, like),
        ilike(blogs.slug, like),
        ilike(blogs.category, like),
      )!,
    );
  }

  const filterWhere = buildFilter(blogFilterMap, body.filter);
  if (filterWhere) conditions.push(filterWhere);

  const query = listAdminBlog(
    conditions.length ? and(...conditions) : undefined,
  );

  return paginate(query, body, blogSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

/* DELETE BLOGS ---------------- */
export async function deleteAdminBlog(id: number) {
  return deleteBlog(id);
}

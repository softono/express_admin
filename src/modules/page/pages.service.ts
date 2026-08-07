import { and } from "drizzle-orm";
import { pages } from "@/models/schema";
import { paginate } from "@/lib/pagination";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/lib/pagination/pagination.validator";
import {
  buildFilter,
  type FilterMap,
} from "@/lib/pagination/buildFilter";
import { dateTimeFormat } from "@/lib/date";
import type { PageSaveInput } from "@/modules/page/page.validator";
import type { Page } from "@/modules/page/page.types";
import {
  updatePage,
  findPageById,
  listAdmin,
  buildPagesSearch,
  pageSortMap,
} from "@/models/page.repository";
import type { UserStatus } from "@/modules/account/user.types";

const pagesFilterMap: FilterMap = {
  title: { column: pages.title, type: "text" },
  slug: { column: pages.slug, type: "text" },
};

function toPage(row: typeof pages.$inferSelect, tz: string): Page {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    status: row.status as UserStatus,
    created_at: dateTimeFormat(row.created_at, tz),
    updated_at: dateTimeFormat(row.updated_at, tz),
  };
}

export async function updateAdminPage(
  id: string,
  body: Partial<PageSaveInput>,
  tz: string,
): Promise<ApiResult> {
  const row = await updatePage(Number(id), {
    ...body,
    updated_at: new Date(),
  });
  if (!row) {
    return { http_status: 404, status: 0, message: "Page not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Page updated successfully",
    data: toPage(row, tz),
  };
}

export async function getAdminPageById(
  id: string,
  tz: string,
): Promise<ApiResult> {
  const row = await findPageById(Number(id));
  if (!row) {
    return { http_status: 404, status: 0, message: "Page not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Page fetched successfully",
    data: toPage(row, tz),
  };
}

export async function listPages(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();

  const conditions = [];

  const searchWhere = buildPagesSearch(search);
  if (searchWhere) conditions.push(searchWhere);

  const filterWhere = buildFilter(pagesFilterMap, body.filter);
  if (filterWhere) conditions.push(filterWhere);

  const query = listAdmin(conditions.length ? and(...conditions) : undefined);

  return paginate(query, body, pageSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

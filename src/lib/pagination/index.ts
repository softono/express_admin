import { asc, desc, sql } from "drizzle-orm";
import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";
import db from "@/lib/db";
import { errorLog } from "@/lib/logger";
import type {
  ApiResult,
  PaginationMeta,
} from "@/lib/pagination/tsgrid.types";
import type { PaginationInput } from "@/lib/pagination/pagination.validator";

interface PaginateOptions<T> {
  /** Fallback sort when the request omits one (or asks for a non-whitelisted field). */
  defaultSort?: { field: string; direction: "asc" | "desc" };
  /** Per-row transform, e.g. toSafeUser. */
  mapRow?: (row: Record<string, unknown>) => T;
}

export type { PaginationMeta };

// Decodes the query-param shape sent by GET list endpoints
// (page, limit, sortField, sortDir, search, filter=<base64 JSON>) into the
// same body shape POST list endpoints validate with `paginationSchema`.
export function parsePaginationQuery(
  searchParams: URLSearchParams,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const sortField = searchParams.get("sortField");
  const sortDir = searchParams.get("sortDir");
  const search = searchParams.get("search");
  const filterRaw = searchParams.get("filter");

  if (page) body.page = page;
  if (limit) body.limit = limit;
  if (sortField) {
    body.sortField = sortField;
    if (sortDir) body.sortDir = sortDir;
  }
  if (search) body.search = { value: search };
  if (filterRaw) {
    try {
      body.filter = JSON.parse(
        Buffer.from(filterRaw, "base64").toString("utf8"),
      );
    } catch {
      // ignore malformed filter param
    }
  }

  return body;
}

/**
 * Generic, reusable pagination executor — the TS port of the Laravel
 * `Pagination::getData` helper.
 *
 * The caller builds the query (base filter + search + per-column filters,
 * via `.$dynamic()`) and hands it over **without** sort/limit/offset applied.
 * This service caps the limit, counts the total, applies a whitelisted sort,
 * paginates, and returns a standard `ApiResult` with `data: { list, pagination }`.
 *
 * `sortMap` doubles as the sort whitelist: only its keys may be sorted, and
 * an unknown `sort.field` falls back to `options.defaultSort`.
 */
// Converted from a static class to a plain exported function (no classes in services).
export async function paginate<T = unknown>(
  query: PgSelect,
  body: PaginationInput,
  sortMap: Record<string, PgColumn>,
  options: PaginateOptions<T> = {},
): Promise<ApiResult> {
  try {
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100);

    let page: number;
    let offset: number;
    if (body.offset !== undefined) {
      offset = Math.max(Number(body.offset) || 0, 0);
      page = Math.floor(offset / limit) + 1;
    } else {
      page = Math.max(Number(body.page) || 1, 1);
      offset = (page - 1) * limit;
    }

    // Count before applying sort/limit/offset (wrap the filtered query as a subquery).
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(query.as("sub"));

    // Resolve sort against the whitelist, else fall back to the default.
    const requested = body.sortField;
    const field =
      requested && sortMap[requested]
        ? requested
        : options.defaultSort?.field;
    const direction =
      body.sortDir ?? options.defaultSort?.direction ?? "desc";

    let q = query;
    if (field && sortMap[field]) {
      q = q.orderBy(
        direction === "asc" ? asc(sortMap[field]) : desc(sortMap[field]),
      );
    }

    const rows = await q.limit(limit).offset(offset);
    const list = options.mapRow ? rows.map(options.mapRow) : rows;

    const pages = total > 0 ? Math.ceil(total / limit) : 1;
    const start = total === 0 ? 0 : offset + 1;
    const end = Math.min(offset + limit, total);

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      pages,
      count:
        total === 0
          ? "No items"
          : `Showing ${start}-${end} of ${total} items`,
    };

    return {
      http_status: 200,
      status: 1,
      message: "Data retrieved successfully",
      data: { list, pagination },
    };
  } catch (error: unknown) {
    errorLog("Error in paginate: " + String(error));
    return {
      http_status: 500,
      status: 0,
      message: "Failed to retrieve data",
    };
  }
}

import {
  and,
  eq,
  ilike,
  inArray,
  between,
  gte,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { FilterVariant } from "@/lib/pagination/tsgrid.types";

export interface FilterMapEntry {
  column: PgColumn;
  type: FilterVariant;
}

export type FilterMap = Record<string, FilterMapEntry>;

function condition(entry: FilterMapEntry, values: string[]): SQL | undefined {
  const col = entry.column;
  const clean = values.filter((v) => v !== "" && v != null);
  if (!clean.length) return undefined;

  switch (entry.type) {
    case "select":
    case "multiSelect":
      // Cast column to text so string values match numeric/enum columns safely.
      return inArray(sql`${col}::text`, clean);

    case "boolean":
      return eq(col, sql`${clean[0] === "true"}::boolean`);

    case "text":
      return ilike(col, `%${clean[0]}%`);

    case "number":
    case "range": {
      const [min, max] = clean;
      if (min && max)
        return between(
          col,
          sql`${Number(min)}::numeric`,
          sql`${Number(max)}::numeric`,
        );
      if (min) return gte(col, sql`${Number(min)}::numeric`);
      if (max) return lte(col, sql`${Number(max)}::numeric`);
      return undefined;
    }

    case "date":
    case "dateRange": {
      const [from, to] = clean;
      if (from && to) return between(col, sql`${from}::date`, sql`${to}::date`);
      if (from) return gte(col, sql`${from}::date`);
      if (to) return lte(col, sql`${to}::date`);
      return undefined;
    }

    default:
      return undefined;
  }
}

/**
 * Turns the request `filter` map (column → values) into a single Drizzle
 * `and(...)` expression, validated against the per-service `filterMap`
 * whitelist. Unknown columns are skipped.
 */
export function buildFilter(
  filterMap: FilterMap,
  filter?: Record<string, string[]>,
): SQL | undefined {
  if (!filter) return undefined;

  const parts: SQL[] = [];
  for (const [key, values] of Object.entries(filter)) {
    const entry = filterMap[key];
    if (!entry || !Array.isArray(values)) continue;
    const expr = condition(entry, values);
    if (expr) parts.push(expr);
  }

  return parts.length ? and(...parts) : undefined;
}

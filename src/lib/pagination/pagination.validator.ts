import { z } from "zod";

/**
 * Structural validator for server-driven list endpoints.
 * `filter` is a column→values map; which columns/types are allowed is
 * enforced per-service via its `filterMap` (see buildFilter).
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  search: z
    .object({
      value: z.string(),
    })
    .optional(),
  filter: z.record(z.string(), z.array(z.string())).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Flat wire shape for GET list endpoints — the serialized form produced by
 * toListQueryParams: page/limit/sortField/sortDir/search as plain strings,
 * filter as base64-JSON.
 */
export const paginationFlatSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  filter: z.string().optional(),
});

export type PaginationFlatInput = z.infer<typeof paginationFlatSchema>;

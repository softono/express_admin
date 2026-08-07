// Slim server-side subset of the frontend tsgrid contract.
export type { ApiResult } from "@/types";
export type {
  PaginationInput,
  PaginationFlatInput,
} from "@/lib/pagination/pagination.validator";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  count: string;
}

export type FilterVariant =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect";

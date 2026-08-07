import { BLOG_CATEGORIES } from "./blog.constants";

export const BLOG_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
export type BlogStatus = (typeof BLOG_STATUS)[keyof typeof BLOG_STATUS];

export interface Blog {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  image?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: BlogStatus;
  created_at?: string;
  updated_at?: string;
}

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]["value"];

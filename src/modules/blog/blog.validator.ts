import { z } from "zod";
import { BLOG_CATEGORIES } from "./blog.constants";
import { userStatusSchema } from "@/modules/account/user.validator";

const categoryValues = BLOG_CATEGORIES.map(
  (c: { value: string }) => c.value,
) as [string, ...string[]];

export const blogCategorySchema = z.enum(categoryValues);

export const blogSaveSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  body: z.string().min(1, "Content is required"),

  category: z.string().min(1, "Category is required"),

  image: z.any().optional(),

  meta_title: z.string().optional(),
  meta_description: z.string().optional(),

  status: userStatusSchema,
});

export type BlogSaveInput = z.input<typeof blogSaveSchema>;

export const blogFormSchema = blogSaveSchema;

export type BlogFormInput = z.infer<typeof blogFormSchema>;

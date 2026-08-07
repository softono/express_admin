import { z } from "zod";

export const seoMetaSaveSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine((val) => !/\s/.test(val), {
      message: "Space not allowed in slug",
    }),
  title: z.string().min(1, "Title is required"),
  keyword: z.string().optional(),
  description: z.string().optional(),
  last_modified: z.string().optional(),
  change_frequency: z.string().optional(),
  priority: z
    .number()
    .min(0, "Priority must be between 0 and 1")
    .max(1, "Priority must be between 0 and 1")
    .optional(),
  sitemap_enable: z.number().optional(),
});

export type SeoMetaSaveInput = z.input<typeof seoMetaSaveSchema>;

export const seoMetaFormSchema = seoMetaSaveSchema;

export type SeoMetaFormInput = z.infer<typeof seoMetaFormSchema>;

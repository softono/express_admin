import { z } from "zod";
import { statusSchema } from "@/modules/account/user.fields";

export const pageSaveSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "slug is required")
    .refine((val) => !/\s/.test(val), {
      message: "Space not allowed in slug",
    }),
  status: statusSchema.optional(),
  body: z.string(),
});

export type PageSaveInput = z.input<typeof pageSaveSchema>;

export const pageFormSchema = pageSaveSchema;

export type PageFormInput = z.infer<typeof pageFormSchema>;

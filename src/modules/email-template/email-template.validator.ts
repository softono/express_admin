import { z } from "zod";

export const emailTemplateSaveSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string(),
});

export type EmailTemplateSaveInput = z.input<typeof emailTemplateSaveSchema>;

export const emailTemplateFormSchema = emailTemplateSaveSchema;

export type EmailTemplateFormInput = z.infer<typeof emailTemplateFormSchema>;

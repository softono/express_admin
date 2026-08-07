import { z } from "zod";

export const mailProcessSchema = z
  .object({
    email: z
      .string({ error: "Recipient email is required" })
      .email("Please provide a valid email address")
      .optional(),
  })
  .refine((v: { email?: string }) => Boolean(v.email), {
    message: "Recipient email is required",
    path: ["email"],
  });

export type MailProcessInput = z.input<typeof mailProcessSchema>;

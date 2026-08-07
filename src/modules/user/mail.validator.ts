import { z } from "zod";
import { emailField } from "@/modules/account/user.fields";

export const userMailSchema = z.object({
  to_user: emailField,
  subject: z.string().min(1).max(255),
  message: z.string().min(1).max(255),
});

export type UserMailInput = z.input<typeof userMailSchema>;

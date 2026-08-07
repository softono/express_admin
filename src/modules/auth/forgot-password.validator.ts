import { z } from "zod";
import { emailField } from "@/modules/account/user.fields";

export const adminForgotPasswordSchema = z.object({
  email: emailField,
  step: z.number().optional(),
  "g-recaptcha-response": z.string().optional(),
});

export type AdminForgotPasswordInput = z.input<
  typeof adminForgotPasswordSchema
>;

export const adminForgotPasswordFormSchema = z.object({
  email: emailField,
});

export type AdminForgotPasswordFormInput = z.infer<
  typeof adminForgotPasswordFormSchema
>;

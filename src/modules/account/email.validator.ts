import { z } from "zod";
import { emailField } from "@/modules/account/user.fields";

export const emailChangeVerifyMethodSchema = z.enum(["totp", "otp", "backup"]);
export type EmailChangeVerifyMethod = z.infer<
  typeof emailChangeVerifyMethodSchema
>;

export const emailChangeStartSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
  email: emailField,
});
export type EmailChangeStartInput = z.input<typeof emailChangeStartSchema>;

export const emailChangeVerifyNewSchema = z.object({
  handle: z.string().min(1),
  code: z.string().min(1, "Code is required"),
});
export type EmailChangeVerifyNewInput = z.input<
  typeof emailChangeVerifyNewSchema
>;

export const emailChangeResendSchema = z.object({
  handle: z.string().min(1),
});
export type EmailChangeResendInput = z.input<typeof emailChangeResendSchema>;

// code is not length(6): backup codes are longer than OTP codes.
export const emailChangeVerifySchema = z.object({
  handle: z.string().min(1),
  method: emailChangeVerifyMethodSchema,
  code: z.string().min(1, "Code is required"),
});
export type EmailChangeVerifyInput = z.input<typeof emailChangeVerifySchema>;

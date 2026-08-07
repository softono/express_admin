import { z } from "zod";
import {
  emailField,
  passwordField,
  otpField,
} from "@/modules/account/user.fields";

export const resetPasswordSchema = z
  .object({
    email: emailField,
    otp: otpField,
    password: passwordField,
    confirm_password: z.string({ error: "Password confirmation is required" }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

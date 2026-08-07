import { z } from "zod";
import { passwordField } from "@/modules/account/user.fields";

// Shared by the user and admin password-change pages — the wire contract
// (auth/change-password) is validated server-side by
// src/server/validators/auth/change-password.validator.ts.
export const changePasswordFormSchema = z
  .object({
    current_password: passwordField,
    new_password: passwordField,
    confirm_password: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.confirm_password === data.new_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;

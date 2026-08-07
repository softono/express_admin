import { z } from "zod";

export const changePasswordSchema = z
  .object({
    current_password: z
      .string({ error: "Current password is required" })
      .min(1, "Current password is required"),
    new_password: z
      .string({ error: "New password is required" })
      .min(6, "Password must be at least 6 characters"),
    confirm_password: z.string({
      error: "Password confirmation is required",
    }),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

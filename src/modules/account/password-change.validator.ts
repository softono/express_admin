import { z } from "zod";

export const adminPasswordChangeSchema = z
  .object({
    current_password: z.string().min(6),
    password: z.string().min(6),
    password_confirm: z.string(),
  })
  .refine((data) => data.password_confirm === data.password, {
    message: "Confirm password does not match",
    path: ["password_confirm"],
  });

export type AdminPasswordChangeInput = z.input<
  typeof adminPasswordChangeSchema
>;

export const adminPasswordChangeFormSchema = z
  .object({
    current_password: z.string().min(6, "Minimum 6 characters"),
    new_password: z.string().min(6, "Minimum 6 characters"),
    confirm_password: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.confirm_password === data.new_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type AdminPasswordChangeFormInput = z.infer<
  typeof adminPasswordChangeFormSchema
>;

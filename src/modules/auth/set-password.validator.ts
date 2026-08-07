import { z } from "zod";

export const setPasswordSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export type SetPasswordInput = z.input<typeof setPasswordSchema>;

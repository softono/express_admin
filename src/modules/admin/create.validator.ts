import { z } from "zod";
import {
  userStatusSchema,
  userRoleSchema,
} from "@/modules/account/user.validator";

export const adminCreateSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Please provide a valid email address"),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  first_name: z.string().trim().optional(),
  last_name: z.string().trim().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  status: userStatusSchema.optional(),
  image: z.any().optional(),
  role: userRoleSchema.optional(),
  permission: z.string().optional(),
  two_factor_enabled: z
    .union([z.boolean(), z.string()])
    .transform((v) => {
      if (typeof v === "boolean") return v;
      return v === "true";
    })
    .optional(),
});

export type AdminCreateInput = z.input<typeof adminCreateSchema>;

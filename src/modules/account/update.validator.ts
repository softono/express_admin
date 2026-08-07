import { z } from "zod";

export const adminAccountUpdateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  image: z.string().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
});

export type AdminAccountUpdateInput = z.input<typeof adminAccountUpdateSchema>;

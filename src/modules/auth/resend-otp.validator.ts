import { z } from "zod";

export const adminResendOtpSchema = z.object({
  authToken: z.string().optional(),
  userId: z.coerce.number().optional(),
  code: z.string().optional(),
});

export type AdminResendOtpInput = z.input<typeof adminResendOtpSchema>;

import { z } from "zod";

export const otpConfirmSchema = z.object({
  otp: z.string({ error: "OTP is required" }),
  id: z.string({ error: "User ID is required" }),
  secretKey: z.string({ error: "Secret key is required" }),
});

export type OtpConfirmInput = z.input<typeof otpConfirmSchema>;

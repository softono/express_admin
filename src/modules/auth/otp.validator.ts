import { z } from "zod";

export const otpSendSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Please provide a valid email address"),
  type: z.enum(["signin", "verify", "reset"], {
    error: "Invalid OTP type",
  }),
});

export type OtpSendInput = z.input<typeof otpSendSchema>;

export const resendOtpSchema = z.object({
  code: z.string({ error: "Code is required" }),
  type: z.string().optional(),
});

export type ResendOtpInput = z.input<typeof resendOtpSchema>;

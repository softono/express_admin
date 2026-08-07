import { z } from "zod";

export const verifyAccountSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Please provide a valid email address"),
  otp: z
    .string({ error: "OTP is required" })
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^[0-9]+$/, "OTP must contain only numeric digits"),
});

export type VerifyAccountInput = z.input<typeof verifyAccountSchema>;

export const verifyAccountFormSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

export type VerifyAccountFormInput = z.infer<typeof verifyAccountFormSchema>;

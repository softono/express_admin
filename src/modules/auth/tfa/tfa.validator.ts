import { z } from "zod";

export const tfaEnableSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});
export type TfaEnableInput = z.input<typeof tfaEnableSchema>;

export const tfaVerifySetupSchema = z.object({
  code: z
    .string({ error: "Code is required" })
    .length(6, "Code must be 6 digits")
    .regex(/^[0-9]+$/, "Code must contain only digits"),
  method: z.enum(["totp", "otp"]).default("totp"),
});
export type TfaVerifySetupInput = z.input<typeof tfaVerifySetupSchema>;

export const tfaDisableSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});
export type TfaDisableInput = z.input<typeof tfaDisableSchema>;

export const tfaVerifyLoginSchema = z.object({
  code: z.string({ error: "Code is required" }).min(1, "Code is required"),
  method: z.enum(["totp", "otp", "backup"], {
    error: "Method must be totp, otp, or backup",
  }),
  trust_device: z.boolean().default(false),
});
export type TfaVerifyLoginInput = z.input<typeof tfaVerifyLoginSchema>;

export const tfaBackupCodesSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});
export type TfaBackupCodesInput = z.input<typeof tfaBackupCodesSchema>;

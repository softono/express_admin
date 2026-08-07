import { z } from "zod";
import { emailField, timezoneField } from "@/modules/account/user.fields";

export const loginOtpSchema = z.preprocess(
  (data) => {
    if (data && typeof data === "object" && "g-recaptcha-response" in data) {
      const d = { ...(data as Record<string, unknown>) };
      d.recaptcha_token = d["g-recaptcha-response"];
      delete d["g-recaptcha-response"];
      return d;
    }
    return data;
  },
  z
    .object({
      step: z.union([z.literal(1), z.literal(2)]),
      email: emailField,
      otp: z.string().optional(),
      timezone: timezoneField,
      recaptcha_token: z.string().optional(),
      country: z.string().optional().default("India"),
      remember: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.step === 2 && !data.otp) {
        ctx.addIssue({
          code: "custom",
          message: "OTP is required",
          path: ["otp"],
        });
      }
      if (data.step === 1 && !data.recaptcha_token) {
        ctx.addIssue({
          code: "custom",
          message: "reCAPTCHA verification is required",
          path: ["recaptcha_token"],
        });
      }
    }),
);

export type LoginOtpInput = z.input<typeof loginOtpSchema>;

export const loginOtpEmailFormSchema = z.object({
  email: emailField,
  otp: z.string(),
});

export type LoginOtpEmailFormInput = z.infer<typeof loginOtpEmailFormSchema>;

export const loginOtpVerifyFormSchema = z.object({
  otp: z
    .string()
    .min(4, "Enter a valid OTP")
    .max(6, "Enter a valid OTP")
    .regex(/^\d+$/, "Enter a valid OTP"),
});

export type LoginOtpVerifyFormInput = z.infer<typeof loginOtpVerifyFormSchema>;

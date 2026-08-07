import { z } from "zod";
import { emailField } from "@/modules/account/user.fields";

export const forgotPasswordSchema = z.preprocess(
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
      step: z
        .number({ error: "Step is required" })
        .refine((v) => [1, 2, 3].includes(v), "Step must be 1, 2 or 3"),
      recaptcha_token: z.string().optional(),
      email: emailField,
      otp: z.string().optional(),
      password: z.string().optional(),
      password_confirm: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.step === 1 && !data.recaptcha_token) {
        ctx.addIssue({
          code: "custom",
          message: "reCAPTCHA verification is required",
          path: ["recaptcha_token"],
        });
      }
      if ((data.step === 2 || data.step === 3) && !data.otp) {
        ctx.addIssue({
          code: "custom",
          message: "OTP is required",
          path: ["otp"],
        });
      }
      if ((data.step === 2 || data.step === 3) && data.otp) {
        if (data.otp.length !== 6) {
          ctx.addIssue({
            code: "custom",
            message: "OTP must be exactly 6 digits",
            path: ["otp"],
          });
        } else if (!/^[0-9]+$/.test(data.otp)) {
          ctx.addIssue({
            code: "custom",
            message: "OTP must contain only numeric digits",
            path: ["otp"],
          });
        }
      }
      if (data.step === 3 && !data.password) {
        ctx.addIssue({
          code: "custom",
          message: "Password is required",
          path: ["password"],
        });
      }
      if (data.step === 3 && data.password && data.password.length < 6) {
        ctx.addIssue({
          code: "custom",
          message: "Password must be at least 6 characters",
          path: ["password"],
        });
      }
      if (data.step === 3 && !data.password_confirm) {
        ctx.addIssue({
          code: "custom",
          message: "Password confirmation is required",
          path: ["password_confirm"],
        });
      }
      if (
        data.step === 3 &&
        data.password_confirm &&
        data.password_confirm !== data.password
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["password_confirm"],
        });
      }
    }),
);

export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

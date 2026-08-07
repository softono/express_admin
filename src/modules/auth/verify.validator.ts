import { z } from "zod";

export const adminVerifySchema = z
  .object({
    otp: z.string({ error: "OTP is required" }),
    code: z
      .string()
      .transform((val) => (val.trim() ? val : undefined))
      .optional(),
    type: z.string().optional(),
    ignore_device: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "tfa" && !data.code) {
      ctx.addIssue({
        code: "custom",
        message: "Code is required",
        path: ["code"],
      });
    }
  });

export type AdminVerifyInput = z.input<typeof adminVerifySchema>;

export const adminVerifyFormSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  ignore_device: z.boolean().optional(),
});

export type AdminVerifyFormInput = z.infer<typeof adminVerifyFormSchema>;

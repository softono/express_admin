import { z } from "zod";

export const verifySchema = z
  .object({
    otp: z.string({ error: "OTP is required" }),
    code: z.string().optional(),
    type: z.string().optional(),
    trust_device: z.boolean().optional(),
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

export type VerifyInput = z.input<typeof verifySchema>;

export const verifyFormSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  trust_device: z.boolean().optional(),
});

export type VerifyFormInput = z.infer<typeof verifyFormSchema>;

import { z } from "zod";
import { emailField, timezoneField } from "@/modules/account/user.fields";

// Shared base for the login endpoints (user + admin). Each endpoint keeps its
// own validator file; diverge with .extend() only when rules actually differ.
export const credentialsSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
  timezone: timezoneField,
  remember: z.boolean().default(false),
});

export const credentialsFormSchema = credentialsSchema
  .pick({ email: true, password: true })
  .extend({ remember: z.boolean() });

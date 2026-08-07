import { z } from "zod";
import {
  userFieldsSchema,
  userStatusSchema,
  booleanFromString,
} from "@/modules/account/user.validator";
import { nameField } from "@/modules/account/user.fields";

export const adminSaveSchema = userFieldsSchema
  .partial()
  .extend({
    permission: z.string().optional(),
    two_factor_enabled: booleanFromString,
  })
  .refine(
    (obj) =>
      Object.keys(obj).filter((k) => obj[k as keyof typeof obj] !== undefined)
        .length >= 1,
    "At least one field must be provided",
  );

export type AdminSaveInput = z.input<typeof adminSaveSchema>;

const adminFormBase = userFieldsSchema
  .pick({ email: true, phone: true, country: true, image: true })
  .extend({
    first_name: nameField("First name"),
    last_name: nameField("Last name"),
    status: userStatusSchema.optional(),
    password: z.string().optional(),
    two_factor_enabled: booleanFromString,
  });

export type AdminFormInput = z.infer<typeof adminFormBase>;

export const adminFormSchema = (isEdit: boolean) =>
  adminFormBase.extend({
    password: isEdit
      ? z.string().optional()
      : z.string().min(1, "Password is required"),
  });

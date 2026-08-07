import { z } from "zod";
import { USER_STATUS, USER_ROLES } from "@/modules/account/user.constants";
import {
  emailField,
  passwordField,
  nameField,
  statusSchema,
  phoneField,
  timezoneField,
} from "@/modules/account/user.fields";

export const userStatusSchema = z.enum([
  USER_STATUS.ACTIVE,
  USER_STATUS.INACTIVE,
]);

export const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === "boolean" ? v : v === "true"))
  .optional();

export const userRoleSchema = z.enum([USER_ROLES.ADMIN, USER_ROLES.USER]);

// Base field set — every user schema derives from this via
// .partial()/.pick()/.omit()/.extend(); never re-declare these fields.
export const userFieldsSchema = z.object({
  email: emailField,
  password: passwordField,
  first_name: nameField("First name"),
  last_name: nameField("Last name"),
  phone: phoneField,
  country: z.string().optional(),
  timezone: timezoneField,
  status: statusSchema.optional(),
  image: z.any().optional(),
  two_factor_enabled: booleanFromString,
});

export const userCreateSchema = userFieldsSchema.extend({
  role: userRoleSchema.optional(),
});

export type UserCreateInput = z.input<typeof userCreateSchema>;

export const userSaveSchema = userFieldsSchema
  .partial()
  .refine(
    (obj) =>
      Object.keys(obj).filter((k) => obj[k as keyof typeof obj] !== undefined)
        .length >= 1,
    "At least one field must be provided",
  );

export type UserSaveInput = z.input<typeof userSaveSchema>;

const userFormBase = userFieldsSchema
  .pick({
    email: true,
    phone: true,
    country: true,
    image: true,
  })
  .extend({
    first_name: nameField("First name"),
    last_name: nameField("Last name"),
    password: z.string().optional(),
    status: userStatusSchema.optional(),
    two_factor_enabled: booleanFromString,
  });

export type UserFormInput = z.infer<typeof userFormBase>;

export const userFormSchema = (isEdit: boolean) =>
  userFormBase.extend({
    password: isEdit
      ? z
          .string()
          .optional()
          .refine(
            (v) => !v || v.length >= 6,
            "Password must be at least 6 characters",
          )
      : passwordField,
  });

export const userMailFormSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(255),
  message: z.string().min(1, "Message is required").max(255),
});

export type UserMailFormInput = z.infer<typeof userMailFormSchema>;

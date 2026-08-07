import { z } from "zod";
import {
  credentialsSchema,
  credentialsFormSchema,
} from "@/modules/auth/login/login.fields";

export const adminLoginSchema = credentialsSchema;

export type AdminLoginInput = z.input<typeof adminLoginSchema>;

export const adminLoginFormSchema = credentialsFormSchema;

export type AdminLoginFormInput = z.infer<typeof adminLoginFormSchema>;

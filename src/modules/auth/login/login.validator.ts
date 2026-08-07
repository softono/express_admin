import { z } from "zod";
import {
  credentialsSchema,
  credentialsFormSchema,
} from "@/modules/auth/login/login.fields";

export const loginSchema = credentialsSchema;

export type LoginInput = z.input<typeof loginSchema>;

export const loginFormSchema = credentialsFormSchema;

export type LoginFormInput = z.infer<typeof loginFormSchema>;

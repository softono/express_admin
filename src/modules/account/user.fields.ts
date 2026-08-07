import { z } from "zod";

// Shared field primitives — every schema composes from these instead of
// re-declaring rules (and drifting messages) inline.

import { USER_STATUS } from "@/modules/account/user.constants";

export const statusSchema = z.enum([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE]);

// Normalized (trim + lowercase) so the same mailbox can never register or
// look up as two different accounts by letter case.
export const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address");

export const passwordField = z
  .string({ error: "Password is required" })
  .min(6, "Password must be at least 6 characters");

export const nameField = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

export const phoneField = z
  .string({ error: "Phone number is required" })
  .regex(/^[0-9]{10}$/, "Phone number must be 10 digits");

export const timezoneField = z.string().default("UTC");

export const otpField = z
  .string({ error: "OTP is required" })
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^[0-9]+$/, "OTP must contain only numeric digits");

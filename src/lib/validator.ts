import { ZodSchema } from "zod";
import { ApiResult } from "@/types";

export function validateData<T>(
  schema: ZodSchema<T>,
  body: unknown,
): ApiResult {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "_";
      if (!errors[path]) errors[path] = issue.message;
    }
    return {
      http_status: 422,
      status: 0,
      message: result.error.issues.map((e) => e.message).join(", "),
      data: { errors: errors },
    };
  }
  return { http_status: 200, status: 1, message: "ok", data: result.data };
}

import type { NextFunction, Request, Response } from "express";
import { errorLog } from "@/lib/logger";
import { sendError } from "@/utils/response";

export function notFound(req: Request, res: Response) {
  sendError(res, 404, "Not Found");
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  errorLog(
    `Error in ${req.method} ${req.path}: ${error instanceof Error ? error.message : String(error)}`,
  );
  if (res.headersSent) return;
  sendError(res, 500, "Something went wrong");
}

import type { Response } from "express";
import { ApiResponse, ApiResult } from "@/types";

export function sendResponse(
  res: Response,
  http_status: number = 200,
  result: Partial<ApiResponse> = {},
): Response {
  const body = {
    status: result.status ?? 1,
    message: result.message ?? "",
    data: result.data ?? [],
    ...Object.fromEntries(
      Object.entries(result).filter(
        ([key]) => !["status", "message", "data", "http_status"].includes(key),
      ),
    ),
  };
  return res.status(http_status ?? 200).json(body);
}

export function sendResult(res: Response, result: Partial<ApiResult>): Response {
  return sendResponse(res, result.http_status ?? 200, result);
}

export function sendMessage(
  res: Response,
  message: string = "Ok",
  status: number = 1,
): Response {
  return sendResponse(res, 200, { status, message, data: [] });
}

export function sendError(
  res: Response,
  http_status: number = 500,
  message: string = "Internal Server Error",
): Response {
  return sendResponse(res, http_status, { status: 0, message, data: [] });
}

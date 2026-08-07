import type { NextFunction, Request, Response } from "express";
import { validateSession } from "@/modules/auth/session.service";
import { USER_STATUS, ADMIN_ROLES } from "@/modules/account/user.constants";
import { hasPermission } from "@/modules/account/permission";
import { getSessionToken } from "@/utils/authCookie";
import { sendError } from "@/utils/response";

export async function userAuth(req: Request, res: Response, next: NextFunction) {
  const token = getSessionToken(req);
  if (!token) {
    sendError(res, 401, "Authentication required");
    return;
  }

  const result = await validateSession(token);
  if (!result) {
    sendError(res, 401, "Authentication required");
    return;
  }

  const { user, session } = result;
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    sendError(res, 401, "User not found or inactive");
    return;
  }

  req.user = user;
  req.session = session;
  next();
}

export async function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = getSessionToken(req);
  if (!token) {
    sendError(res, 401, "Authentication required");
    return;
  }

  const result = await validateSession(token);
  if (!result) {
    sendError(res, 401, "Authentication required");
    return;
  }

  const { user, session } = result;
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    sendError(res, 403, "Admin access required");
    return;
  }

  if (!(ADMIN_ROLES as readonly string[]).includes(user.role as string)) {
    sendError(res, 403, "Admin access required");
    return;
  }

  if (!hasPermission(user, req.method, req.originalUrl.split("?")[0])) {
    sendError(res, 403, "Insufficient permissions");
    return;
  }

  req.user = user;
  req.session = session;
  next();
}

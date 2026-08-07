import type { NextFunction, Request, Response } from "express";
import { randomAlnum } from "@/lib/random";
import { COOKIE_NAMES, setDeviceCookie } from "@/utils/authCookie";

// Mirrors the device-uid behavior of the Next.js proxy: issue a device
// cookie on the first response if the client doesn't have one yet.
export function deviceCookie(req: Request, res: Response, next: NextFunction) {
  const existing = req.cookies?.[COOKIE_NAMES.DEVICE_UID];
  if (existing) {
    req.deviceUid = existing;
    return next();
  }
  const uid = randomAlnum(64);
  setDeviceCookie(res, uid);
  // Make the fresh uid visible to downstream reads within this request.
  req.cookies[COOKIE_NAMES.DEVICE_UID] = uid;
  req.deviceUid = uid;
  next();
}

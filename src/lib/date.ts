import { DateTime } from "luxon";
import config from "../config";
import type { Request } from "express";

const TIMEZONE_ALIASES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "US/Eastern": "America/New_York",
  "US/Central": "America/Chicago",
  "US/Pacific": "America/Los_Angeles",
  "US/Mountain": "America/Denver",
};

/**
 * Format a date using Luxon format tokens (e.g. "yyyy-MM-dd HH:mm:ss").
 * When `timeZone` is provided, the output reflects that zone.
 */
export function dateTimeFormat(
  date: Date | string | number,
  timeZone?: string,
  format: string = "yyyy-MM-dd HH:mm:ss",
): string {
  try {
    const dt =
      date instanceof Date
        ? DateTime.fromJSDate(date)
        : DateTime.fromJSDate(new Date(date));

    if (!dt.isValid) return "";

    const zoned = timeZone ? dt.setZone(timeZone) : dt;
    return zoned.toFormat(format);
  } catch {
    return "";
  }
}

export function dateFormat(
  date: Date | string | number,
  timeZone?: string,
): string {
  return dateTimeFormat(date, timeZone, "MMMM d, yyyy");
}

export function currentTime(
  format: string = "yyyy-MM-dd HH:mm:ss",
  timeZone?: string,
): string {
  return dateTimeFormat(new Date(), timeZone, format);
}

function getTimezoneCookieName(): string {
  return `${config.APP_UID || "app"}_tz`;
}

export function getClientTimezone(req: Request): string {
  const raw = req.cookies[getTimezoneCookieName()];
  if (!raw) return process.env.NEXT_PUBLIC_APP_TIMEZONE || "UTC";
  return TIMEZONE_ALIASES[raw] || raw;
}

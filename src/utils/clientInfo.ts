import type { Request } from "express";
import { getDeviceUid } from "./authCookie";

export type ClientInfo = {
  ip: string;
  client: string;
  device_id?: string;
};

export function getClientInfo(req: Request): ClientInfo {
  const ip = getClientIp(req);
  const client = getUserAgent(req);
  const device_id = getDeviceUid(req);
  return {
    ip,
    client,
    device_id,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.get("x-forwarded-for");
  if (typeof forwarded === "string" && forwarded.trim()) {
    const ips = parseForwardedFor(forwarded);

    for (let i = ips.length - 1; i >= 0; i--) {
      const candidate = ips[i];
      if (candidate && !isPrivateIp(candidate)) return candidate;
    }

    if (ips.length > 0) return ips[ips.length - 1];
  }

  const realIp = req.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return req.ip ?? "";
}

export function getUserAgent(req: Request): string {
  return req.get("user-agent")?.trim() ?? "";
}

function isPrivateIp(ip: string): boolean {
  const v = ip.trim();
  if (!v) return true;

  if (v === "::1") return true;
  if (v.startsWith("127.")) return true;
  if (v.startsWith("10.")) return true;
  if (v.startsWith("172.")) {
    const parts = v.split(".").map(Number);
    if (parts.length >= 2 && parts[1] >= 16 && parts[1] <= 31) return true;
  }
  if (v.startsWith("192.168.")) return true;
  if (v.toLowerCase().startsWith("fe80:")) return true;
  if (v.toLowerCase().startsWith("fc") || v.toLowerCase().startsWith("fd"))
    return true;

  return false;
}

function parseForwardedFor(headerValue: string): string[] {
  return headerValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Server-safe device name parser (basic fallback)
export function deviceName(userAgent: string = ""): string {
  if (!userAgent) return "Unknown Device";
  if (/mobile/i.test(userAgent)) return "Mobile Device";
  if (/windows/i.test(userAgent)) return "Windows PC";
  if (/macintosh|mac os x/i.test(userAgent)) return "Mac";
  if (/linux/i.test(userAgent)) return "Linux";
  return userAgent.split(" ")[0] || "Device";
}

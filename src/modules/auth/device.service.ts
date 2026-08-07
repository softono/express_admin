import type { Request } from "express";

import { getDeviceUid } from "@/utils/authCookie";
import { getClientIp, getUserAgent } from "@/utils/clientInfo";
import {
  findTrustedDevice,
  findDeviceByUserAndUid,
  updateDeviceTrust,
  insertDevice,
  deleteDeviceByUserAndUid,
  deleteDevicesByUser,
} from "@/models/user-device.repository";

const TRUST_DAYS = 30;

export async function isDeviceTrusted(
  userId: string,
  deviceUid: string,
): Promise<boolean> {
  if (!deviceUid) return false;
  const row = await findTrustedDevice(userId, deviceUid);
  return !!row;
}

export async function trustDevice(
  req: Request,
  userId: string,
): Promise<void> {
  const deviceUid = getDeviceUid(req);
  if (!deviceUid) return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRUST_DAYS * 24 * 60 * 60 * 1000);

  const existing = await findDeviceByUserAndUid(userId, deviceUid);

  if (existing) {
    await updateDeviceTrust(existing.id, {
      trusted_at: now,
      expires_at: expiresAt,
      ip_address: getClientIp(req),
      user_agent: getUserAgent(req),
    });
  } else {
    await insertDevice({
      user_id: userId,
      device_uid: deviceUid,
      ip_address: getClientIp(req),
      user_agent: getUserAgent(req),
      trusted_at: now,
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    });
  }
}

export async function revokeDeviceTrust(
  userId: string,
  deviceUid: string,
): Promise<void> {
  await deleteDeviceByUserAndUid(userId, deviceUid);
}

export async function revokeAllDeviceTrust(userId: string): Promise<void> {
  await deleteDevicesByUser(userId);
}

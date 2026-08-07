import { eq, and, gt } from "drizzle-orm";
import db from "@/lib/db";
import { userDevices } from "@/models/user-device";

export async function findTrustedDevice(
  userId: string,
  deviceUid: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: userDevices.id })
    .from(userDevices)
    .where(
      and(
        eq(userDevices.user_id, userId),
        eq(userDevices.device_uid, deviceUid),
        gt(userDevices.expires_at, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findDeviceByUserAndUid(
  userId: string,
  deviceUid: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: userDevices.id })
    .from(userDevices)
    .where(
      and(
        eq(userDevices.user_id, userId),
        eq(userDevices.device_uid, deviceUid),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateDeviceTrust(
  id: string,
  values: {
    trusted_at: Date;
    expires_at: Date;
    ip_address: string;
    user_agent: string;
  },
): Promise<void> {
  await db.update(userDevices).set(values).where(eq(userDevices.id, id));
}

export async function insertDevice(
  values: typeof userDevices.$inferInsert,
): Promise<void> {
  await db.insert(userDevices).values(values);
}

export async function deleteDeviceByUserAndUid(
  userId: string,
  deviceUid: string,
): Promise<void> {
  await db
    .delete(userDevices)
    .where(
      and(
        eq(userDevices.user_id, userId),
        eq(userDevices.device_uid, deviceUid),
      ),
    );
}

export async function deleteDevicesByUser(userId: string): Promise<void> {
  await db.delete(userDevices).where(eq(userDevices.user_id, userId));
}

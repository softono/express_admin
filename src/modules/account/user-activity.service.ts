import { insertUserActivity } from "@/models/user-activity.repository";
import { type ClientInfo } from "@/utils/clientInfo";
import { USER_ACTIVITY } from "./user.constants";

type ActivityDataField = { field: string; old: unknown; new: unknown };
export type ActivityData = ActivityDataField | ActivityDataField[];

export async function logActivity(
  type: keyof typeof USER_ACTIVITY,
  user_id: string,
  clientInfo: ClientInfo,
  data?: string,
) {
  if (!user_id) {
    return false;
  }
  const result = await insertUserActivity({
    user_id: String(user_id),
    type,
    ip: clientInfo.ip,
    client: clientInfo.client,
    device_id: clientInfo.device_id,
    data: data || "",
  });

  return result;
}

export async function logActivityData(
  type: keyof typeof USER_ACTIVITY,
  user_id: string,
  clientInfo: ClientInfo,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>,
) {
  let data: ActivityData | undefined;

  if (oldData && newData) {
    const changes: ActivityDataField[] = [];
    const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    for (const field of keys) {
      const oldVal = oldData[field];
      const newVal = newData[field];
      if (oldVal !== newVal) {
        changes.push({ field, old: oldVal ?? null, new: newVal ?? null });
      }
    }
    if (changes.length > 0) data = changes;
  }

  return await insertUserActivity({
    user_id: String(user_id),
    type,
    ip: clientInfo.ip,
    client: clientInfo.client,
    device_id: clientInfo.device_id,
    data: data !== undefined ? JSON.stringify(data) : undefined,
  });
}

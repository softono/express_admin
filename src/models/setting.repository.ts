import { asc } from "drizzle-orm";
import db from "@/lib/db";
import { settings, type ISetting } from "@/models/schema";

export async function findAllSettingsOrdered(): Promise<ISetting[]> {
  return db
    .select()
    .from(settings)
    .orderBy(asc(settings.group), asc(settings.key));
}

export async function findAllSettings(): Promise<ISetting[]> {
  return db.select().from(settings);
}

export async function upsertSetting(data: {
  key: string;
  value: string;
  type?: string;
  group?: string | null;
  updated_at?: Date;
}): Promise<void> {
  const set: Record<string, unknown> = {
    value: data.value,
    updated_at: data.updated_at ?? new Date(),
  };
  if (data.type !== undefined) set.type = data.type;
  if (data.group !== undefined) set.group = data.group;

  await db
    .insert(settings)
    .values({
      key: data.key,
      value: data.value,
      type: data.type ?? "public",
      group: data.group,
    })
    .onConflictDoUpdate({ target: settings.key, set });
}

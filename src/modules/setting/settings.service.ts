import { getCache, setCache, deleteCache } from "@/lib/cache";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  findAllSettings,
  upsertSetting,
} from "@/models/setting.repository";

const ENCRYPTED_SETTING_KEYS = new Set([
  "google_client_secret",
  "smtp_password",
  "google_recaptcha_secret_key",
]);

const CACHE_KEY = "setting:all";
const CACHE_TTL = 3600;

type SettingEntry = { value: string; type: string };

async function loadAll(): Promise<Record<string, SettingEntry>> {
  const cached = await getCache(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const rows = await findAllSettings();
  const map: Record<string, SettingEntry> = {};
  for (const row of rows) {
    const value = ENCRYPTED_SETTING_KEYS.has(row.key)
      ? decrypt(row.value)
      : row.value;
    map[row.key] = { value, type: row.type };
  }
  await setCache(CACHE_KEY, JSON.stringify(map), CACHE_TTL);
  return map;
}

function toKeyValue(map: Record<string, SettingEntry>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(map)) {
    result[key] = entry.value;
  }
  return result;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  return toKeyValue(await loadAll());
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  const map = await loadAll();
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(map)) {
    if (entry.type === "public") {
      result[key] = entry.value;
    }
  }
  return result;
}

export async function getSetting(key: string): Promise<string> {
  const map = await loadAll();
  return map[key]?.value ?? "";
}

export async function updateSetting(
  key: string,
  value: string,
  type: number | string = 0,
): Promise<void> {
  const storedValue = ENCRYPTED_SETTING_KEYS.has(key) ? encrypt(value) : value;
  await upsertSetting({
    key,
    value: storedValue,
    type: String(type),
    updated_at: new Date(),
  });

  await invalidateSettingsCache();
}

export async function invalidateSettingsCache(): Promise<void> {
  await deleteCache(CACHE_KEY);
}

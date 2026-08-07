import { deleteCache } from "@/lib/cache";
import path from "path";
import fs from "fs/promises";
import { logActivity } from "@/modules/account/user-activity.service";
import { encrypt, decrypt } from "@/lib/encryption";
import { type ClientInfo } from "@/utils/clientInfo";
import {
  findAllSettingsOrdered,
  upsertSetting,
} from "@/models/setting.repository";

const ENCRYPTED_SETTING_KEYS = new Set([
  "google_client_secret",
  "smtp_password",
  "google_recaptcha_secret_key",
]);

interface SettingUpsert {
  key: string;
  value: string;
  type?: string;
  group?: string;
}

/** Upsert a batch of settings keyed by `key` (replaces Mongoose bulkWrite upserts). */
async function upsertSettings(rows: SettingUpsert[]): Promise<void> {
  for (const { key, value: rawValue, type, group } of rows) {
    const value = ENCRYPTED_SETTING_KEYS.has(key)
      ? encrypt(rawValue)
      : rawValue;
    await upsertSetting({ key, value, type, group });
  }
}

export async function saveAdminSettings(
  payload:
    | Record<string, string>
    | Array<{ key: string; value: string; type?: string; group?: string }>,
  actorId?: string,
  clientInfo?: ClientInfo,
): Promise<void> {
  const body = payload;

  const entries: Array<{
    key: string;
    value: string;
    type?: string;
    group?: string;
  }> = Array.isArray(body)
    ? body
    : Object.entries(body ?? {}).map(([key, value]) => ({
        key,
        value: value as string,
      }));

  if (!entries.length) throw new Error("No settings provided");

  const ALLOWED_KEYS = new Set([
    "date_format",
    "date_time_format",
    "user_email_verify",
    "user_login_with_otp",
    "admin_email",
    "cookie_consent",
  ]);

  const invalidKeys = entries
    .filter((e) => !ALLOWED_KEYS.has(e.key))
    .map((e) => e.key);
  if (invalidKeys.length)
    throw new Error(`Invalid setting keys: ${invalidKeys.join(", ")}`);

  const rows = entries.map(({ key, value, type, group }) => ({
    key,
    value: String(value),
    type,
    group,
  }));

  await upsertSettings(rows);
  await deleteCache("app_settings");
  if (actorId && clientInfo) {
    await logActivity("SETTING_UPDATE", actorId, clientInfo);
  }
}

export async function getAdminSettingsMap(): Promise<Record<string, string>> {
  const rows = await findAllSettingsOrdered();
  const map: Record<string, string> = {};
  for (const s of rows) {
    map[s.key] = ENCRYPTED_SETTING_KEYS.has(s.key) ? decrypt(s.value) : s.value;
  }
  return map;
}

const ALLOWED_EMAIL_KEYS = new Set([
  "smtp_host",
  "smtp_port",
  "smtp_encryption",
  "smtp_username",
  "smtp_password",
  "mail_from_address",
  "mail_from_name",
]);

export async function saveAdminEmailSettings(
  payload: Record<string, string>,
): Promise<void> {
  const entries = Object.entries(payload ?? {}).filter(([key]) =>
    ALLOWED_EMAIL_KEYS.has(key),
  );

  if (!entries.length) throw new Error("No valid email settings provided");

  const rows = entries.map(([key, value]) => ({
    key,
    value: String(value),
    type: "private",
  }));

  await upsertSettings(rows);
  await deleteCache("app_settings");
}

export async function saveAdminCaptchaSettings(
  payload: Record<string, string>,
): Promise<void> {
  const body = payload as Record<string, string>;

  const ALLOWED_CAPTCHA_KEYS = new Set([
    "google_recaptcha",
    "google_recaptcha_secret_key",
    "google_recaptcha_public_key",
  ]);

  const entries = Object.entries(body ?? {}).filter(([key]) =>
    ALLOWED_CAPTCHA_KEYS.has(key),
  );
  if (!entries.length) throw new Error("No valid captcha settings provided");

  const rows = entries.map(([key, value]) => ({
    key,
    value: String(value),
    group: "captcha",
    type: "private",
  }));

  await upsertSettings(rows);
  await deleteCache("app_settings");
}

export async function saveAdminContentSettings(
  payload: Record<string, string>,
): Promise<void> {
  const body = payload as Record<string, string>;

  const ALLOWED_CONTENT_KEYS = new Set(["header_content", "footer_content"]);

  const entries = Object.entries(body ?? {}).filter(([key]) =>
    ALLOWED_CONTENT_KEYS.has(key),
  );

  if (!entries.length) throw new Error("No valid content settings provided");

  const rows = entries.map(([key, value]) => ({
    key,
    value: String(value),
    group: "content",
    type: "public",
  }));

  await upsertSettings(rows);
  await deleteCache("app_settings");
}

export async function saveAdminSocialSettings(
  payload: Record<string, string>,
): Promise<void> {
  const body = payload as Record<string, string>;

  const ALLOWED_SOCIAL_KEYS = new Set([
    "google_login",
    "google_client_id",
    "google_client_secret",
  ]);

  const entries = Object.entries(body ?? {}).filter(([key]) =>
    ALLOWED_SOCIAL_KEYS.has(key),
  );
  if (!entries.length) throw new Error("No valid social settings provided");

  const rows = entries.map(([key, value]) => ({
    key,
    value: String(value),
    group: "social",
    type: "private",
  }));

  await upsertSettings(rows);
  await deleteCache("app_settings");
}

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
];
const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "upload",
  "assets",
  "images",
);

export async function saveAdminLogoSetting(
  file: File | null,
  key?: string,
): Promise<{ status: number; message: string; data: { path: string } }> {
  const settingKey = key || "app_logo";

  if (!file) throw new Error("No file provided");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Invalid file type");
  if (file.size > 2 * 1024 * 1024)
    throw new Error("File size must be under 2MB");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
  };

  const ext = MIME_TO_EXT[file.type] || "png";
  let filename = "";
  if (settingKey === "setting.app_logo") {
    filename = "logo.png";
  } else if (settingKey === "setting.app_favicon") {
    filename = "favicon.png";
  } else {
    filename = `${settingKey.replace(/\./g, "_")}.${ext}`;
  }

  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  const relativePath = `storage/assets/images/${filename}`;

  await upsertSettings([
    { key: settingKey, value: relativePath, group: "general", type: "private" },
  ]);

  await deleteCache("app_settings");

  return {
    status: 1,
    message: "Logo saved successfully",
    data: { path: relativePath },
  };
}

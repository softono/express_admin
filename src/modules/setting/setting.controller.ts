import type { Request, Response } from "express";
import { flushCache } from "@/lib/cache";
import { sendMail } from "@/lib/mailer";
import { validateData } from "@/lib/validator";
import { toFile } from "@/lib/upload";
import { mailProcessSchema } from "@/modules/setting/mail-process.validator";
import {
  getAdminSettingsMap,
  saveAdminCaptchaSettings,
  saveAdminContentSettings,
  saveAdminEmailSettings,
  saveAdminLogoSetting,
  saveAdminSettings,
  saveAdminSocialSettings,
} from "@/modules/setting/setting.service";
import { getPublicSettings } from "@/modules/setting/settings.service";
import { getClientInfo } from "@/utils/clientInfo";
import { sendError, sendMessage, sendResponse, sendResult } from "@/utils/response";

export async function getPublicSettingsController(req: Request, res: Response) {
  const settings = await getPublicSettings();
  return sendResponse(res, 200, {
    data: settings,
    message: "Public settings retrieved",
  });
}

export async function saveSettingsController(req: Request, res: Response) {
  const clientInfo = getClientInfo(req);
  await saveAdminSettings(req.body, String(req.user?.id ?? ""), clientInfo);
  return sendResponse(res, 200, { status: 1, message: "Settings saved successfully" });
}

export async function getSettingsController(req: Request, res: Response) {
  const map = await getAdminSettingsMap();
  return sendResponse(res, 200, { status: 1, data: map });
}

export async function saveCaptchaSettingsController(req: Request, res: Response) {
  await saveAdminCaptchaSettings(req.body as Record<string, string>);
  return sendResponse(res, 200, { status: 1, message: "CAPTCHA settings saved successfully" });
}

export async function saveContentSettingsController(req: Request, res: Response) {
  await saveAdminContentSettings(req.body as Record<string, string>);
  return sendResponse(res, 200, { status: 1, message: "Content settings saved successfully" });
}

export async function saveEmailSettingsController(req: Request, res: Response) {
  await saveAdminEmailSettings(req.body);
  return sendResponse(res, 200, { status: 1, message: "Email settings saved successfully" });
}

export async function saveLogoSettingController(req: Request, res: Response) {
  const result = await saveAdminLogoSetting(
    toFile(req.file),
    typeof req.body?.key === "string" ? req.body.key : undefined,
  );
  return sendResponse(res, 200, result);
}

export async function saveSocialSettingsController(req: Request, res: Response) {
  await saveAdminSocialSettings(req.body as Record<string, string>);
  return sendResponse(res, 200, { status: 1, message: "Social settings saved successfully" });
}

export async function mailProcessController(req: Request, res: Response) {
  const validated = validateData(mailProcessSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const result = await sendMail(
    data.email!,
    "Next App",
    "<p>This is a test email to verify your SMTP configuration is working correctly.</p>",
  );

  if (result.status !== 1) {
    return sendError(res, 500, result.message || "Failed to send test email");
  }
  return sendMessage(res, "Test email sent successfully");
}

export async function clearCacheController(req: Request, res: Response) {
  await flushCache();
  return sendResponse(res, 200, { status: 1, message: "Cache cleared successfully" });
}

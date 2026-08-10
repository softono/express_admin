import { Router } from "express";
import { upload } from "@/lib/upload";
import {
  clearCacheController,
  getSettingsController,
  mailProcessController,
  saveCaptchaSettingsController,
  saveContentSettingsController,
  saveEmailSettingsController,
  saveLogoSettingController,
  saveSettingsController,
  saveSocialSettingsController,
} from "@/modules/setting/setting.controller";

const router = Router();

router.post("/setting/save", saveSettingsController);
router.get("/setting/update", getSettingsController);
router.post("/setting/save-captcha", saveCaptchaSettingsController);
router.post("/setting/save-content", saveContentSettingsController);
router.post("/setting/save-email", saveEmailSettingsController);
router.post("/setting/save-logo", upload.single("file"), saveLogoSettingController);
router.post("/setting/save-social", saveSocialSettingsController);
router.post("/setting/mail-process", mailProcessController);
router.get("/setting/cache-clear", clearCacheController);

export default router;

import { Router } from "express";
import { upload } from "@/lib/upload";
import {
  getEmailTemplateController,
  listEmailTemplatesController,
  saveEmailTemplateFileController,
  updateEmailTemplateController,
} from "@/modules/email-template/email-template.controller";

const router = Router();

router.get("/email-template", listEmailTemplatesController);
router.get("/email-template/:id", getEmailTemplateController);
router.patch("/email-template/:id", updateEmailTemplateController);
router.post("/email-template/:id/save-file", upload.single("file"), saveEmailTemplateFileController);

export default router;

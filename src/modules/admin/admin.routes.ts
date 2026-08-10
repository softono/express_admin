import { Router } from "express";
import { upload } from "@/lib/upload";
import {
  adminActivityController,
  adminSessionsController,
  createAdminController,
  deleteAdminController,
  getAdminController,
  listAdminsController,
  updateAdminController,
} from "@/modules/admin/admin.controller";

const router = Router();

router.get("/admins", listAdminsController);
router.post("/admins", upload.single("image"), createAdminController);
router.get("/admins/:id", getAdminController);
router.patch("/admins/:id", upload.single("image"), updateAdminController);
router.delete("/admins/:id", deleteAdminController);
router.get("/admins/:id/session", adminSessionsController);
router.get("/admins/:id/activity", adminActivityController);

export default router;

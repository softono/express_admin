import { Router } from "express";
import { upload } from "@/lib/upload";
import {
  accountActivityController,
  accountSessionsController,
  dashboardChartUserController,
  dashboardController,
  deleteAccountImageController,
  getProfileController,
  listSessionsController,
  listUserActivitiesController,
  logoutSessionController,
  revokeAllSessionsController,
  updateAccountController,
  uploadAccountImageController,
  viewAccountController,
} from "@/modules/account/account.controller";

const router = Router();

router.get("/account/view", viewAccountController);
router.get("/account/profile", getProfileController);
router.put("/account/update", updateAccountController);
router.post("/account/upload-image", upload.single("image"), uploadAccountImageController);
router.delete("/account/delete-image", deleteAccountImageController);
router.get("/account/session", accountSessionsController);
router.post("/account/revoke-all", revokeAllSessionsController);
router.get("/account/user-activity", accountActivityController);

router.get("/user-activities", listUserActivitiesController);
router.get("/sessions", listSessionsController);
router.post("/sessions/logout", logoutSessionController);

router.get("/dashboard", dashboardController);
router.get("/dashboard/get-chart-user", dashboardChartUserController);

export default router;

import { Router } from "express";
import { upload } from "@/lib/upload";
import {
  createUserController,
  deleteUserController,
  getUserController,
  listUsersController,
  mailUserController,
  updateUserController,
  userActivityController,
  userMailsController,
  userSessionsController,
} from "@/modules/user/user.controller";

const router = Router();

router.get("/users", listUsersController);
router.post("/users", upload.single("image"), createUserController);
router.post("/users/mail", mailUserController);
router.get("/users/:id", getUserController);
router.patch("/users/:id", upload.single("image"), updateUserController);
router.delete("/users/:id", deleteUserController);
router.get("/users/:id/sessions", userSessionsController);
router.get("/users/:id/activity", userActivityController);
router.get("/users/:id/mails", userMailsController);

export default router;

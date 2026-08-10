import { Router } from "express";
import {
  getPageController,
  listPagesController,
  updatePageController,
} from "@/modules/page/page.controller";

const router = Router();

router.get("/page", listPagesController);
router.get("/page/:id", getPageController);
router.patch("/page/:id", updatePageController);

export default router;

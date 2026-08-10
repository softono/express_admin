import { Router } from "express";
import {
  createSeoMetaController,
  deleteSeoMetaController,
  generateSitemapController,
  getSeoMetaController,
  listSeoMetasController,
  updateSeoMetaController,
} from "@/modules/seo/seo.controller";

const router = Router();

router.get("/seos", listSeoMetasController);
router.post("/seos", createSeoMetaController);
router.post("/seos/sitemap", generateSitemapController);
router.get("/seos/:id", getSeoMetaController);
router.patch("/seos/:id", updateSeoMetaController);
router.delete("/seos/:id", deleteSeoMetaController);

export default router;

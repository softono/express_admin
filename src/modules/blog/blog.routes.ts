import { Router } from "express";
import { upload } from "@/lib/upload";
import {
  createBlogController,
  deleteBlogController,
  getBlogController,
  listBlogsController,
  updateBlogController,
} from "@/modules/blog/blog.controller";

const router = Router();

router.get("/blogs", listBlogsController);
router.post("/blogs", upload.single("image"), createBlogController);
router.get("/blogs/:id", getBlogController);
router.patch("/blogs/:id", upload.single("image"), updateBlogController);
router.delete("/blogs/:id", deleteBlogController);

export default router;

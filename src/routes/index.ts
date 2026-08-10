import { Router } from "express";
import { adminAuth } from "@/middleware/auth";
import authRoutes from "@/modules/auth/auth.routes";
import { getPublicSettingsController } from "@/modules/setting/setting.controller";
import accountRoutes from "@/modules/account/account.routes";
import adminModuleRoutes from "@/modules/admin/admin.routes";
import blogRoutes from "@/modules/blog/blog.routes";
import emailTemplateRoutes from "@/modules/email-template/email-template.routes";
import pageRoutes from "@/modules/page/page.routes";
import seoRoutes from "@/modules/seo/seo.routes";
import settingRoutes from "@/modules/setting/setting.routes";
import userRoutes from "@/modules/user/user.routes";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: 1, message: "Ok", data: [] });
});

// Shared auth engine (session, logout, 2FA challenge + management, passkeys)
// used by the admin panel's login and account-security pages.
router.use("/auth", authRoutes);

// --- Public: public settings ---
// Admin login goes through the shared "/auth/login" route (mounted
// separately) — adminAuth still gates every route below by role.
router.get("/setting/public", getPublicSettingsController);

// Everything below requires admin auth (+ per-route permission checks).
router.use(adminAuth);

router.use(accountRoutes);
router.use(adminModuleRoutes);
router.use(userRoutes);
router.use(blogRoutes);
router.use(pageRoutes);
router.use(seoRoutes);
router.use(emailTemplateRoutes);
router.use(settingRoutes);

export default router;

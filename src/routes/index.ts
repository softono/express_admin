import { Router } from "express";
import adminRoutes from "@/routes/admin.routes";
import authRoutes from "@/modules/auth/auth.routes";

const router = Router();

router.get("/api/health", (req, res) => {
  res.json({ status: 1, message: "Ok", data: [] });
});

// Shared auth engine (session, logout, 2FA challenge + management, passkeys)
// used by the admin panel's login and account-security pages.
router.use("/api/auth", authRoutes);
router.use("/api/admin", adminRoutes);

export default router;

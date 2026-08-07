import { Router } from "express";
import multer from "multer";
import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { flushCache } from "@/lib/cache";
import { dateTimeFormat, getClientTimezone } from "@/lib/date";
import { MIME_IMAGE, uploadFile, validateFile } from "@/lib/file";
import { sendMail } from "@/lib/mailer";
import { parsePaginationQuery, paginate } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import { adminAuth } from "@/middleware/auth";
import {
  activateAccount,
  activityList,
  createAccount,
  deactivateAccount,
  deleteAccount,
  deleteImage,
  logoutAllSessions,
  logoutDeviceById,
  sessionList,
  updateImage,
  updateProfile,
  validateUserId,
} from "@/modules/account/account.service";
import { USER_ACTIVITY, USER_ROLES, USER_STATUS } from "@/modules/account/user.constants";
import { toSafeUser } from "@/modules/account/user.service";
import { userCreateSchema, userSaveSchema } from "@/modules/account/user.validator";
import { adminAccountUpdateSchema } from "@/modules/account/update.validator";
import { getAdminChartUser, getAdminDashboardCounts } from "@/modules/account/dashboard.service";
import { getAdminProfileById, listAdmins } from "@/modules/admin/admin.service";
import { adminCreateSchema } from "@/modules/admin/create.validator";
import { adminSaveSchema } from "@/modules/admin/save.validator";
import {
  createAdminBlog,
  deleteAdminBlog,
  getAdminBlogById,
  listBlogs,
  updateAdminBlog,
} from "@/modules/blog/blog.service";
import {
  getEmailTemplateById,
  listEmailTemplates,
  updateEmailTemplate,
} from "@/modules/email-template/email-template.service";
import { getAdminPageById, listPages, updateAdminPage } from "@/modules/page/pages.service";
import {
  createAdminSeoMeta,
  deleteAdminSeoMeta,
  generatePureSitemap,
  getAdminSeoMetaById,
  listSeoMetas,
  updateAdminSeoMeta,
} from "@/modules/seo/seo.service";
import { mailProcessSchema } from "@/modules/setting/mail-process.validator";
import {
  getAdminSettingsMap,
  saveAdminCaptchaSettings,
  saveAdminContentSettings,
  saveAdminEmailSettings,
  saveAdminLogoSetting,
  saveAdminSettings,
  saveAdminSocialSettings,
} from "@/modules/setting/setting.service";
import { getUserById, getUserMailsList, listUsers, sendAdminMail } from "@/modules/user/user.service";
import { getPublicSettings } from "@/modules/setting/settings.service";
import { userMailSchema } from "@/modules/user/mail.validator";
import { adminLoginSchema } from "@/modules/auth/login.validator";
import { AuthService } from "@/modules/auth";
import { emailTemplateSaveSchema } from "@/modules/email-template/email-template.validator";
import { seoMetaSaveSchema } from "@/modules/seo/seo.validator";
import { blogSaveSchema, type BlogSaveInput } from "@/modules/blog/blog.validator";
import { pageSaveSchema, type PageSaveInput } from "@/modules/page/page.validator";
import { userActivities, users, userSessions } from "@/models/schema";
import {
  getDeviceUid,
  setSessionCookie,
  setTfaChallengeCookie,
} from "@/utils/authCookie";
import { deviceName, getClientInfo } from "@/utils/clientInfo";
import { sendError, sendMessage, sendResponse, sendResult } from "@/utils/response";

const upload = multer({ storage: multer.memoryStorage() });

function toFile(f?: Express.Multer.File): File | null {
  return f
    ? new File([new Uint8Array(f.buffer)], f.originalname, { type: f.mimetype })
    : null;
}

function paginationBody(req: { originalUrl: string }) {
  return parsePaginationQuery(
    new URL(req.originalUrl, "http://localhost").searchParams,
  );
}

const router = Router();

// --- Public: admin login ---

router.post("/auth/login", async (req, res) => {
  const validated = validateData(adminLoginSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const clientInfo = getClientInfo(req);
  const result = await AuthService.adminLogin(req, validated.data, clientInfo);

  if (result.status === 1 && result.data?.token) {
    setSessionCookie(res, result.data.token, {
      remember: validated.data.remember,
    });
    delete result.data.token;
  } else if (result.status === 1 && result.data?.tfaHandle) {
    setTfaChallengeCookie(res, result.data.tfaHandle);
    delete result.data.tfaHandle;
  }
  return sendResult(res, result);
});

router.get("/setting/public", async (req, res) => {
  const settings = await getPublicSettings();
  return sendResponse(res, 200, {
    data: settings,
    message: "Public settings retrieved",
  });
});

// Everything below requires admin auth (+ per-route permission checks).
router.use(adminAuth);

// --- Account (self) ---

router.get("/account/view", async (req, res) => {
  return sendResponse(res, 200, {
    status: 1,
    message: "Admin info fetched successfully",
    data: toSafeUser(req.user!),
  });
});

router.get("/account/profile", async (req, res) => {
  return sendResponse(res, 200, { status: 1, message: "", data: toSafeUser(req.user!) });
});

router.put("/account/update", async (req, res) => {
  const validated = validateData(adminAccountUpdateSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const clientInfo = getClientInfo(req);
  const result = await updateProfile(req.user!.id, validated.data, clientInfo, {
    activityType: "ADMIN_UPDATE",
    entityLabel: "Admin",
  });
  return sendResult(res, result);
});

router.post("/account/upload-image", upload.single("image"), async (req, res) => {
  const clientInfo = getClientInfo(req);
  const result = await updateImage(req.user!.id, toFile(req.file) as Blob, clientInfo);
  return sendResult(res, result);
});

router.delete("/account/delete-image", async (req, res) => {
  return sendResult(res, await deleteImage(req.user!.id));
});

router.get("/account/session", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  const deviceUid = getDeviceUid(req);
  return sendResult(
    res,
    await sessionList(req.user!.id, validated.data, getClientTimezone(req), deviceUid),
  );
});

router.post("/account/revoke-all", async (req, res) => {
  const currentToken = req.session?.token;
  return sendResult(
    res,
    await logoutAllSessions(req.user!.id, currentToken || undefined),
  );
});

router.get("/account/user-activity", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(
    res,
    await activityList(req.user!.id, validated.data, getClientTimezone(req)),
  );
});

// --- Admins CRUD ---

const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] as const;
const userRoles = [USER_ROLES.USER] as const;
const validActions = new Set(["activate", "deactivate"]);

router.get("/admins", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listAdmins(validated.data, getClientTimezone(req)));
});

router.post("/admins", upload.single("image"), async (req, res) => {
  const validated = validateData(adminCreateSchema, req.body ?? {});
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "profile");
  }

  const result = await createAccount(
    {
      ...data,
      email: data.email.toLowerCase(),
      role: data.role ?? "ADMIN",
      status: data.status ?? USER_STATUS.ACTIVE,
      emailVerified: false,
    },
    { role: data.role ?? "ADMIN", entityLabel: "Admin" },
  );

  if (result.status === 0)
    return sendError(res, 500, result.message ?? "An unexpected error occurred");

  return sendResponse(res, 201, {
    status: 1,
    message: "Admin created successfully",
    data: result.data,
  });
});

router.get("/admins/:id", async (req, res) => {
  const id = String(req.params.id);
  const result = await getAdminProfileById(id, getClientTimezone(req));
  if (result.status === 0) {
    return sendError(res, result.http_status ?? 404, result.message ?? "Admin not found");
  }
  return sendResponse(res, 200, { status: 1, data: result.data });
});

router.patch("/admins/:id", upload.single("image"), async (req, res) => {
  const id = String(req.params.id);
  const fields = req.body ?? {};

  const action = fields.action;
  if (action) {
    if (!validActions.has(action)) return sendError(res, 400, "Invalid action");

    const result =
      action === "activate"
        ? await activateAccount(id, { entityLabel: "Admin", roleFilter: adminRoles })
        : await deactivateAccount(id, { entityLabel: "Admin", roleFilter: adminRoles });

    return sendResponse(res, 200, {
      status: 1,
      message: result.message ?? `Admin ${action}d successfully`,
      data: result.data ?? undefined,
    });
  }

  const validated = validateData(adminSaveSchema, fields);
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "profile");
  }

  const clientInfo = getClientInfo(req);
  const result = await updateProfile(id, data, clientInfo, {
    activityType: "ADMIN_UPDATE",
    entityLabel: "Admin",
  });
  return sendResult(res, result);
});

router.delete("/admins/:id", async (req, res) => {
  const id = String(req.params.id);
  const result = await deleteAccount(id, {
    entityLabel: "Admin",
    roleFilter: adminRoles,
  });
  if (result.status === 0) {
    return sendError(res, 500, result.message ?? "An unexpected error occurred");
  }
  return sendResponse(res, 200, {
    status: 1,
    message: result.message ?? "Admin deleted successfully",
  });
});

router.get("/admins/:id/session", async (req, res) => {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await sessionList(id, validated.data, getClientTimezone(req)));
});

router.get("/admins/:id/activity", async (req, res) => {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await activityList(id, validated.data, getClientTimezone(req)));
});

// --- Users CRUD ---

router.get("/users", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listUsers(validated.data, getClientTimezone(req)));
});

router.post("/users", upload.single("image"), async (req, res) => {
  const validated = validateData(userCreateSchema, req.body ?? {});
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "profile");
  }

  const result = await createAccount(
    {
      ...data,
      email: data.email.toLowerCase(),
      role: "USER",
      status: data.status ?? USER_STATUS.ACTIVE,
      emailVerified: false,
    },
    { role: "USER", entityLabel: "User" },
  );

  if (result.status === 0)
    return sendError(res, 500, result.message ?? "An unexpected error occurred");

  return sendResponse(res, 201, {
    status: 1,
    message: "User created successfully",
    data: result.data,
  });
});

router.post("/users/mail", async (req, res) => {
  const validated = validateData(userMailSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const result = await sendAdminMail({
    to_user: data.to_user,
    subject: data.subject,
    message: data.message,
  });

  if (result.status === 0) {
    return sendError(res, 500, result.message ?? "Failed to send mail");
  }
  return sendMessage(res, "Email sent to user");
});

router.get("/users/:id", async (req, res) => {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const result = await getUserById(id, getClientTimezone(req));
  if (result.status === 0) {
    return sendError(res, 404, result.message ?? "User not found");
  }
  return sendResponse(res, 200, { status: 1, data: result.data });
});

router.patch("/users/:id", upload.single("image"), async (req, res) => {
  const id = String(req.params.id);
  const fields = req.body ?? {};

  const action = fields.action;
  if (action) {
    if (!validActions.has(action)) return sendError(res, 400, "Invalid action");

    const result =
      action === "activate"
        ? await activateAccount(id, { entityLabel: "User", roleFilter: userRoles })
        : await deactivateAccount(id, { entityLabel: "User", roleFilter: userRoles });

    return sendResponse(res, 200, {
      status: 1,
      message: result.message ?? `User ${action}d successfully`,
      data: result.data,
    });
  }

  const validated = validateData(userSaveSchema, fields);
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "profile");
  }

  const clientInfo = getClientInfo(req);
  const result = await updateProfile(id, data, clientInfo, {
    activityType: "USER_UPDATE",
    entityLabel: "User",
  });
  return sendResult(res, result);
});

router.delete("/users/:id", async (req, res) => {
  const id = String(req.params.id);
  const result = await deleteAccount(id, {
    entityLabel: "User",
    roleFilter: userRoles,
  });
  if (result.status === 0) {
    return sendError(res, result.http_status ?? 400, result.message ?? "Failed to delete user");
  }
  return sendResponse(res, 200, {
    status: 1,
    message: result.message ?? "User deleted successfully",
  });
});

router.get("/users/:id/sessions", async (req, res) => {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await sessionList(id, validated.data, getClientTimezone(req)));
});

router.get("/users/:id/activity", async (req, res) => {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await activityList(id, validated.data, getClientTimezone(req)));
});

router.get("/users/:id/mails", async (req, res) => {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await getUserMailsList(id, validated.data, getClientTimezone(req)));
});

// --- Global user activities & sessions ---

router.get("/user-activities", async (req, res) => {
  const tz = getClientTimezone(req);
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  const query = db
    .select({
      id: userActivities.id,
      user_id: userActivities.user_id,
      type: userActivities.type,
      ip: userActivities.ip,
      client: userActivities.client,
      created_at: userActivities.created_at,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      role: users.role,
    })
    .from(userActivities)
    .leftJoin(users, eq(userActivities.user_id, users.id))
    .$dynamic();

  const result = await paginate(
    query,
    validated.data,
    {
      type: userActivities.type,
      ip: userActivities.ip,
      client: userActivities.client,
      created_at: userActivities.created_at,
    },
    {
      defaultSort: { field: "created_at", direction: "desc" },
      mapRow: (row: Record<string, unknown>) => ({
        ...row,
        type: USER_ACTIVITY[row.type as keyof typeof USER_ACTIVITY] || row.type,
        client: deviceName(row.client as string),
        created_at: dateTimeFormat(row.created_at as Date, tz),
      }),
    },
  );
  return sendResult(res, result);
});

router.get("/sessions", async (req, res) => {
  const tz = getClientTimezone(req);
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  const query = db
    .select({
      id: userSessions.id,
      user_id: userSessions.user_id,
      device_uid: userSessions.device_uid,
      user_agent: userSessions.user_agent,
      ip_address: userSessions.ip_address,
      created_at: userSessions.created_at,
      expires_at: userSessions.expires_at,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      role: users.role,
    })
    .from(userSessions)
    .leftJoin(users, eq(userSessions.user_id, users.id))
    .$dynamic();

  const result = await paginate(
    query,
    validated.data,
    {
      user_agent: userSessions.user_agent,
      ip_address: userSessions.ip_address,
      created_at: userSessions.created_at,
    },
    {
      defaultSort: { field: "created_at", direction: "desc" },
      mapRow: (row: Record<string, unknown>) => ({
        ...row,
        user_agent: deviceName(row.user_agent as string),
        created_at: dateTimeFormat(row.created_at as Date, tz),
        expires_at: dateTimeFormat(row.expires_at as Date, tz),
      }),
    },
  );
  return sendResult(res, result);
});

router.post("/sessions/logout", async (req, res) => {
  const body = req.body ?? {};
  const sessionId = body?.device_id || body?.id;
  if (!sessionId) return sendError(res, 400, "Session id is required");

  const clientInfo = getClientInfo(req);
  return sendResult(res, await logoutDeviceById(sessionId, clientInfo, req.user!.id));
});

// --- Blogs ---

router.get("/blogs", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listBlogs(validated.data, getClientTimezone(req)));
});

router.post("/blogs", upload.single("image"), async (req, res) => {
  const validated = validateData(blogSaveSchema, req.body ?? {});
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "images");
  }

  const blog = await createAdminBlog(data, getClientTimezone(req));
  return sendResponse(res, 201, {
    status: 1,
    data: blog,
    message: "Blog created successfully",
  });
});

function parseNumericId(id: string): number | null {
  const n = Number(id);
  return n && !isNaN(n) ? n : null;
}

router.get("/blogs/:id", async (req, res) => {
  const id = parseNumericId(String(req.params.id));
  if (!id) return sendError(res, 400, "Invalid blog id");

  const blog = await getAdminBlogById(String(id), getClientTimezone(req));
  if (!blog) return sendError(res, 404, "Blog not found");

  return sendResponse(res, 200, {
    status: 1,
    data: blog,
    message: "Blog fetched successfully",
  });
});

router.patch("/blogs/:id", upload.single("image"), async (req, res) => {
  const id = parseNumericId(String(req.params.id));
  if (!id) return sendError(res, 400, "Invalid blog id");

  const fields = req.body ?? {};

  const action = fields.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(res, 400, "Invalid action");
    }
    const data: Partial<BlogSaveInput> = {
      status: action === "activate" ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE,
    };
    const blog = await updateAdminBlog(id, data, getClientTimezone(req));
    if (!blog) return sendError(res, 404, "Blog not found");

    return sendResponse(res, 200, {
      status: 1,
      data: blog,
      message: `Blog ${action === "activate" ? "activated" : "deactivated"} successfully`,
    });
  }

  const validated = validateData(blogSaveSchema.partial(), fields);
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "images");
  }

  const blog = await updateAdminBlog(id, data, getClientTimezone(req));
  if (!blog) return sendError(res, 404, "Blog not found");

  return sendResponse(res, 200, {
    status: 1,
    data: blog,
    message: "Blog updated successfully",
  });
});

router.delete("/blogs/:id", async (req, res) => {
  const id = parseNumericId(String(req.params.id));
  if (!id) return sendError(res, 400, "Invalid blog id");

  const deleted = await deleteAdminBlog(id);
  if (!deleted) return sendError(res, 404, "Blog not found");

  return sendResponse(res, 200, {
    status: 1,
    data: deleted,
    message: "Blog deleted successfully",
  });
});

// --- Pages ---

router.get("/page", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listPages(validated.data, getClientTimezone(req)));
});

router.get("/page/:id", async (req, res) => {
  const id = String(req.params.id);
  return sendResult(res, await getAdminPageById(id, getClientTimezone(req)));
});

router.patch("/page/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = req.body ?? {};

  const action = body.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(res, 400, "Invalid action");
    }
    const data: Partial<PageSaveInput> = {
      status: action === "activate" ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE,
    };
    const result = await updateAdminPage(id, data, getClientTimezone(req));
    return sendResponse(res, 200, {
      status: 1,
      data: result?.data,
      message: `Page ${action === "activate" ? "activated" : "deactivated"} successfully`,
    });
  }

  const validated = validateData(pageSaveSchema, body);
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await updateAdminPage(id, validated.data, getClientTimezone(req)));
});

// --- SEO ---

router.get("/seos", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listSeoMetas(validated.data, getClientTimezone(req)));
});

router.post("/seos", async (req, res) => {
  const validated = validateData(seoMetaSaveSchema, req.body ?? {});
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await createAdminSeoMeta(validated.data));
});

router.post("/seos/sitemap", async (req, res) => {
  const result = await generatePureSitemap();
  return sendResponse(res, 200, {
    status: 1,
    data: result,
    message: "Sitemap updated successfully",
  });
});

router.get("/seos/:id", async (req, res) => {
  return sendResult(res, await getAdminSeoMetaById(String(req.params.id)));
});

router.patch("/seos/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = req.body ?? {};

  const action = body?.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(res, 400, "Invalid action");
    }
    return sendResult(
      res,
      await updateAdminSeoMeta(id, {
        sitemap_enable: action === "activate" ? 1 : 0,
      }),
    );
  }

  const validated = validateData(seoMetaSaveSchema.partial(), body);
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await updateAdminSeoMeta(id, validated.data));
});

router.delete("/seos/:id", async (req, res) => {
  return sendResult(res, await deleteAdminSeoMeta(String(req.params.id)));
});

// --- Email templates ---

router.get("/email-template", async (req, res) => {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listEmailTemplates(validated.data, getClientTimezone(req)));
});

router.get("/email-template/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!id) return sendError(res, 400, "Template ID is required");

  return sendResult(res, await getEmailTemplateById(id, getClientTimezone(req)));
});

router.patch("/email-template/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!id) return sendError(res, 400, "Template ID is required");

  const validated = validateData(emailTemplateSaveSchema.partial(), req.body ?? {});
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await updateEmailTemplate(id, validated.data, getClientTimezone(req)));
});

router.post("/email-template/:id/save-file", upload.single("file"), async (req, res) => {
  const id = String(req.params.id);
  if (!id) return sendError(res, 400, "Template ID is required");

  if (!req.file) return sendError(res, 400, "No file provided");
  if (req.file.size > 256 * 1024) {
    return sendError(res, 400, "File exceeds the 256KB limit");
  }

  const text = req.file.buffer.toString("utf8");
  return sendResult(res, await updateEmailTemplate(id, { body: text }, getClientTimezone(req)));
});

// --- Dashboard ---

router.get("/dashboard", async (req, res) => {
  const { total, active, inactive } = await getAdminDashboardCounts();
  return sendResponse(res, 200, {
    data: { total, active, inactive },
    message: "Admin dashboard data retrieved",
  });
});

router.get("/dashboard/get-chart-user", async (req, res) => {
  const period = String(req.query.type || req.query.period || "") || undefined;
  const months = req.query.months ? Number(req.query.months) : undefined;

  const data = await getAdminChartUser({ period, months });
  return sendResponse(res, 200, { status: 1, data });
});

// --- Settings ---

router.post("/setting/save", async (req, res) => {
  const clientInfo = getClientInfo(req);
  await saveAdminSettings(req.body, String(req.user?.id ?? ""), clientInfo);
  return sendResponse(res, 200, { status: 1, message: "Settings saved successfully" });
});

router.get("/setting/update", async (req, res) => {
  const map = await getAdminSettingsMap();
  return sendResponse(res, 200, { status: 1, data: map });
});

router.post("/setting/save-captcha", async (req, res) => {
  await saveAdminCaptchaSettings(req.body as Record<string, string>);
  return sendResponse(res, 200, { status: 1, message: "CAPTCHA settings saved successfully" });
});

router.post("/setting/save-content", async (req, res) => {
  await saveAdminContentSettings(req.body as Record<string, string>);
  return sendResponse(res, 200, { status: 1, message: "Content settings saved successfully" });
});

router.post("/setting/save-email", async (req, res) => {
  await saveAdminEmailSettings(req.body);
  return sendResponse(res, 200, { status: 1, message: "Email settings saved successfully" });
});

router.post("/setting/save-logo", upload.single("file"), async (req, res) => {
  const result = await saveAdminLogoSetting(
    toFile(req.file),
    typeof req.body?.key === "string" ? req.body.key : undefined,
  );
  return sendResponse(res, 200, result);
});

router.post("/setting/save-social", async (req, res) => {
  await saveAdminSocialSettings(req.body as Record<string, string>);
  return sendResponse(res, 200, { status: 1, message: "Social settings saved successfully" });
});

router.post("/setting/mail-process", async (req, res) => {
  const validated = validateData(mailProcessSchema, req.body);
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const result = await sendMail(
    data.email!,
    "Next App",
    "<p>This is a test email to verify your SMTP configuration is working correctly.</p>",
  );

  if (result.status !== 1) {
    return sendError(res, 500, result.message || "Failed to send test email");
  }
  return sendMessage(res, "Test email sent successfully");
});

router.get("/setting/cache-clear", async (req, res) => {
  await flushCache();
  return sendResponse(res, 200, { status: 1, message: "Cache cleared successfully" });
});


export default router;

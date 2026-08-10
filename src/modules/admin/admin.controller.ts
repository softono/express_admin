import type { Request, Response } from "express";
import { MIME_IMAGE, uploadFile, validateFile } from "@/lib/file";
import { getClientTimezone } from "@/lib/date";
import { paginationBody } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import { toFile } from "@/lib/upload";
import {
  activateAccount,
  activityList,
  createAccount,
  deactivateAccount,
  deleteAccount,
  sessionList,
  updateProfile,
  validateUserId,
} from "@/modules/account/account.service";
import { USER_ROLES, USER_STATUS } from "@/modules/account/user.constants";
import { getAdminProfileById, listAdmins } from "@/modules/admin/admin.service";
import { adminCreateSchema } from "@/modules/admin/create.validator";
import { adminSaveSchema } from "@/modules/admin/save.validator";
import { getClientInfo } from "@/utils/clientInfo";
import { sendError, sendResponse, sendResult } from "@/utils/response";

const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] as const;
const validActions = new Set(["activate", "deactivate"]);

export async function listAdminsController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listAdmins(validated.data, getClientTimezone(req)));
}

export async function createAdminController(req: Request, res: Response) {
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
}

export async function getAdminController(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await getAdminProfileById(id, getClientTimezone(req));
  if (result.status === 0) {
    return sendError(res, result.http_status ?? 404, result.message ?? "Admin not found");
  }
  return sendResponse(res, 200, { status: 1, data: result.data });
}

export async function updateAdminController(req: Request, res: Response) {
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
}

export async function deleteAdminController(req: Request, res: Response) {
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
}

export async function adminSessionsController(req: Request, res: Response) {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await sessionList(id, validated.data, getClientTimezone(req)));
}

export async function adminActivityController(req: Request, res: Response) {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await activityList(id, validated.data, getClientTimezone(req)));
}

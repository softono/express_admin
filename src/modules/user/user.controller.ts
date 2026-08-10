import type { Request, Response } from "express";
import { MIME_IMAGE, uploadFile, validateFile } from "@/lib/file";
import { getClientTimezone } from "@/lib/date";
import { paginationBody } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import { toFile } from "@/lib/upload";
import {
  activateAccount,
  createAccount,
  deactivateAccount,
  deleteAccount,
  activityList,
  sessionList,
  updateProfile,
  validateUserId,
} from "@/modules/account/account.service";
import { USER_ROLES, USER_STATUS } from "@/modules/account/user.constants";
import { userCreateSchema, userSaveSchema } from "@/modules/account/user.validator";
import { getUserById, getUserMailsList, listUsers, sendAdminMail } from "@/modules/user/user.service";
import { userMailSchema } from "@/modules/user/mail.validator";
import { getClientInfo } from "@/utils/clientInfo";
import { sendError, sendMessage, sendResponse, sendResult } from "@/utils/response";

const userRoles = [USER_ROLES.USER] as const;
const validActions = new Set(["activate", "deactivate"]);

export async function listUsersController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listUsers(validated.data, getClientTimezone(req)));
}

export async function createUserController(req: Request, res: Response) {
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
}

export async function mailUserController(req: Request, res: Response) {
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
}

export async function getUserController(req: Request, res: Response) {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const result = await getUserById(id, getClientTimezone(req));
  if (result.status === 0) {
    return sendError(res, 404, result.message ?? "User not found");
  }
  return sendResponse(res, 200, { status: 1, data: result.data });
}

export async function updateUserController(req: Request, res: Response) {
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
}

export async function deleteUserController(req: Request, res: Response) {
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
}

export async function userSessionsController(req: Request, res: Response) {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await sessionList(id, validated.data, getClientTimezone(req)));
}

export async function userActivityController(req: Request, res: Response) {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await activityList(id, validated.data, getClientTimezone(req)));
}

export async function userMailsController(req: Request, res: Response) {
  const id = String(req.params.id);
  const invalid = await validateUserId(id);
  if (invalid) return sendError(res, 400, invalid.message ?? "Invalid user ID");

  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await getUserMailsList(id, validated.data, getClientTimezone(req)));
}

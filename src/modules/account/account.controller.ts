import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { dateTimeFormat, getClientTimezone } from "@/lib/date";
import { paginationBody, paginate } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import { toFile } from "@/lib/upload";
import {
  activityList,
  deleteImage,
  logoutAllSessions,
  logoutDeviceById,
  sessionList,
  updateImage,
  updateProfile,
} from "@/modules/account/account.service";
import { USER_ACTIVITY } from "@/modules/account/user.constants";
import { toSafeUser } from "@/modules/account/user.service";
import { adminAccountUpdateSchema } from "@/modules/account/update.validator";
import { getAdminChartUser, getAdminDashboardCounts } from "@/modules/account/dashboard.service";
import { userActivities, users, userSessions } from "@/models/schema";
import { getDeviceUid } from "@/utils/authCookie";
import { deviceName, getClientInfo } from "@/utils/clientInfo";
import { sendError, sendResponse, sendResult } from "@/utils/response";

export async function viewAccountController(req: Request, res: Response) {
  return sendResponse(res, 200, {
    status: 1,
    message: "Admin info fetched successfully",
    data: toSafeUser(req.user!),
  });
}

export async function getProfileController(req: Request, res: Response) {
  return sendResponse(res, 200, { status: 1, message: "", data: toSafeUser(req.user!) });
}

export async function updateAccountController(req: Request, res: Response) {
  const validated = validateData(adminAccountUpdateSchema, req.body);
  if (!validated.status) return sendResult(res, validated);

  const clientInfo = getClientInfo(req);
  const result = await updateProfile(req.user!.id, validated.data, clientInfo, {
    activityType: "ADMIN_UPDATE",
    entityLabel: "Admin",
  });
  return sendResult(res, result);
}

export async function uploadAccountImageController(req: Request, res: Response) {
  const clientInfo = getClientInfo(req);
  const result = await updateImage(req.user!.id, toFile(req.file) as Blob, clientInfo);
  return sendResult(res, result);
}

export async function deleteAccountImageController(req: Request, res: Response) {
  return sendResult(res, await deleteImage(req.user!.id));
}

export async function accountSessionsController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  const deviceUid = getDeviceUid(req);
  return sendResult(
    res,
    await sessionList(req.user!.id, validated.data, getClientTimezone(req), deviceUid),
  );
}

export async function revokeAllSessionsController(req: Request, res: Response) {
  const currentToken = req.session?.token;
  return sendResult(
    res,
    await logoutAllSessions(req.user!.id, currentToken || undefined),
  );
}

export async function accountActivityController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(
    res,
    await activityList(req.user!.id, validated.data, getClientTimezone(req)),
  );
}

export async function listUserActivitiesController(req: Request, res: Response) {
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
}

export async function listSessionsController(req: Request, res: Response) {
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
}

export async function logoutSessionController(req: Request, res: Response) {
  const body = req.body ?? {};
  const sessionId = body?.device_id || body?.id;
  if (!sessionId) return sendError(res, 400, "Session id is required");

  const clientInfo = getClientInfo(req);
  return sendResult(res, await logoutDeviceById(sessionId, clientInfo, req.user!.id));
}

export async function dashboardController(req: Request, res: Response) {
  const { total, active, inactive } = await getAdminDashboardCounts();
  return sendResponse(res, 200, {
    data: { total, active, inactive },
    message: "Admin dashboard data retrieved",
  });
}

export async function dashboardChartUserController(req: Request, res: Response) {
  const period = String(req.query.type || req.query.period || "") || undefined;
  const months = req.query.months ? Number(req.query.months) : undefined;

  const data = await getAdminChartUser({ period, months });
  return sendResponse(res, 200, { status: 1, data });
}

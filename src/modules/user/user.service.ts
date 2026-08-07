import { users } from "@/models/schema";
import {
  listContactMessages,
  contactMessageSortMap,
} from "@/models/contact-message.repository";
import {
  getUserById as repoGetUserById,
  toSafeUser,
  resolveUserImage,
} from "@/modules/account/user.service";
import { infoLog } from "@/lib/logger";
import { invalidateSessionCache } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { USER_ROLES } from "@/modules/account/user.constants";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/lib/pagination/pagination.validator";
import { paginate } from "@/lib/pagination";
import {
  buildFilter,
  type FilterMap,
} from "@/lib/pagination/buildFilter";
import { dateTimeFormat } from "@/lib/date";
import {
  findUserSummaryById,
  listUsersByRole,
  userSortMap,
} from "@/models/user.repository";
import {
  listSessionsByUserForAdmin,
  deleteSessionByIdAndUser,
} from "@/models/user-session.repository";

export async function getUserForAutologin(
  userId: string | number,
): Promise<ApiResult> {
  const user = await findUserSummaryById(userId);

  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  return {
    http_status: 200,
    status: 1,
    message: "User retrieved successfully",
    data: user,
  };
}

const userFilterMap: FilterMap = {
  name: { column: users.first_name, type: "text" },
  email: { column: users.email, type: "text" },
  phone: { column: users.phone, type: "text" },
  status: { column: users.status, type: "multiSelect" },
  created_at: { column: users.created_at, type: "date" },
};

export async function listUsers(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();
  const filterWhere = buildFilter(userFilterMap, body.filter);

  const query = listUsersByRole(USER_ROLES.USER, search, filterWhere);

  return paginate(query, body, userSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      image: resolveUserImage(row.image as string | null),
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

export async function getUserById(
  userId: string | number,
  tz: string,
): Promise<ApiResult> {
  const user = toSafeUser(await repoGetUserById(userId));
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "User retrieved successfully",
    data: {
      ...user,
      created_at: dateTimeFormat(user.created_at as Date, tz),
      updated_at: dateTimeFormat(user.updated_at as Date, tz),
    },
  };
}

export async function getUserSessions(
  userId: string | number,
  tz: string,
): Promise<ApiResult> {
  const rows = await listSessionsByUserForAdmin(String(userId));

  return {
    http_status: 200,
    status: 1,
    message: "User sessions retrieved successfully",
    data: rows.map((row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at, tz),
      expires_at: dateTimeFormat(row.expires_at, tz),
    })),
  };
}

export async function deleteUserSession(
  userId: string | number,
  sessionId: string,
): Promise<ApiResult> {
  const result = await deleteSessionByIdAndUser(sessionId, String(userId));

  if (!result) {
    return { http_status: 404, status: 0, message: "Session not found" };
  }

  await invalidateSessionCache(result.token);

  infoLog(`Admin deleted user session: ${sessionId} for user: ${userId}`);
  return {
    http_status: 200,
    status: 1,
    message: "Session deleted successfully",
  };
}

export async function getUserMailsList(
  userId: string | number,
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listContactMessages(String(userId));

  return paginate(query, body, contactMessageSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

export async function sendAdminMail(payload: {
  to_user: string;
  subject: string;
  message: string;
}): Promise<ApiResult> {
  const escaped = payload.message.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch] as string,
  );
  const result = await sendMail(
    payload.to_user,
    payload.subject,
    `<p>${escaped}</p>`,
  );
  if (result.status === 0) {
    return { http_status: 500, status: 0, message: result.message };
  }
  return { http_status: 200, status: 1, message: "Email sent" };
}

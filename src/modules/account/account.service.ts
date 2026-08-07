import { USER_STATUS } from "@/modules/account/user.constants";
import { USER_ACTIVITY } from "@/modules/account/user.constants";
import type { UserStatus } from "@/modules/account/user.types";
import {
  getUserByEmail,
  getUserById,
  saveUser,
  toSafeUser,
} from "@/modules/account/user.service";
import { invalidateSessionCache, hashPassword } from "@/lib/auth";
import { invalidateUserCache } from "@/modules/auth/session.service";
import {
  uploadFile,
  deleteFile,
  validateFile,
  MIME_IMAGE,
  getFileUrl,
} from "@/lib/file";
import { ClientInfo, deviceName } from "@/utils/clientInfo";
import { dateTimeFormat } from "@/lib/date";
import { logActivity, logActivityData } from "./user-activity.service";
import { ApiResult } from "@/types";
import { paginate } from "@/lib/pagination";
import type { PaginationInput } from "@/lib/pagination/pagination.validator";
import { randomBytes } from "crypto";
import {
  findUserByPhone,
  insertUser,
  updateUser,
  updateUserStatusWithRoleFilter,
  findUserById as repoFindUserById,
  deleteUserById,
} from "@/models/user.repository";
import {
  listUserActivity,
  userActivitySortMap,
} from "@/models/user-activity.repository";
import {
  listSessionsByUser,
  sessionSortMap,
  deleteSessionsByUserExceptToken,
  deleteSessionByIdAndUser,
  deleteSessionById,
  deleteSessionsByUser,
} from "@/models/user-session.repository";
import { listNotes, noteSortMap } from "@/models/note.repository";
import { insertUserAccount } from "@/models/user-account.repository";

export async function validateUniqueData(
  email?: string,
  phone?: string,
  excludeUserId?: string | number,
): Promise<ApiResult | null> {
  if (email) {
    const existing = await getUserByEmail(email);

    if (existing && existing.id !== String(excludeUserId)) {
      return {
        http_status: 409,
        status: 0,
        message: "Email already in use",
      };
    }
  }

  if (phone) {
    const existing = await findUserByPhone(phone);

    if (existing && existing.id !== String(excludeUserId)) {
      return {
        http_status: 409,
        status: 0,
        message: "Phone number already in use",
      };
    }
  }

  return null;
}

export async function validateUserId(
  userId: string | number,
): Promise<ApiResult | null> {
  if (!userId) {
    return { http_status: 400, status: 0, message: "Invalid user ID" };
  }
  return null;
}

export async function createAccount(
  data: Record<string, unknown>,
  options: { role: string; entityLabel?: string },
): Promise<ApiResult> {
  const { role, entityLabel = "Account" } = options;

  const email = String(data?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return {
      http_status: 400,
      status: 0,
      message: "Email is required",
    };
  }

  const phone =
    data?.phone !== undefined &&
    data?.phone !== null &&
    String(data.phone).trim() !== ""
      ? String(data.phone).trim()
      : undefined;

  const validation = await validateUniqueData(email, phone);

  if (validation) {
    return validation;
  }

  const firstName = String(data?.first_name || "").trim();
  const lastName = String(data?.last_name || "").trim();
  const password = String(data?.password || "").trim();

  const passwordHash = await hashPassword(password);

  const user = await insertUser({
    id: randomBytes(16).toString("hex"),
    email,

    first_name: firstName,
    last_name: lastName,
    phone,
    country: data?.country ? String(data.country) : "",
    timezone: data?.timezone ? String(data.timezone) : "UTC",
    role,
    status: (data?.status as UserStatus) ?? USER_STATUS.ACTIVE,
    two_factor_enabled: data?.two_factor_enabled
      ? Boolean(data.two_factor_enabled)
      : false,
    permission: data?.permission ? String(data.permission) : "",
    image: data?.image ? String(data.image) : "",
  });

  await insertUserAccount({
    account_id: user.id,
    provider_id: "credential",
    user_id: user.id,
    password: passwordHash,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return {
    http_status: 200,
    status: 1,
    message: `${entityLabel} created successfully`,
    data: toSafeUser(user),
  };
}

export async function updateProfile(
  userId: string | number,
  data: Record<string, string | undefined>,
  clientInfo: ClientInfo,
  opts: {
    activityType?: keyof typeof USER_ACTIVITY;
    entityLabel?: string;
  } = {},
): Promise<ApiResult> {
  const { activityType = "ACCOUNT_UPDATE", entityLabel = "User" } = opts;
  const user = await getUserById(userId);
  if (!user)
    return {
      http_status: 404,
      status: 0,
      message: `${entityLabel} not found`,
    };

  const oldData = {
    first_name: user.first_name,
    last_name: user.last_name,
    country: user.country,
    timezone: user.timezone,
    phone: user.phone,
    email: user.email,
    image: user.image,
    permission: user.permission,
  };

  const emailChanged =
    data.email && data.email.trim() !== "" && data.email !== user.email;
  const phoneChanged =
    data.phone && data.phone.trim() !== "" && data.phone !== user.phone;

  const validation = await validateUniqueData(
    emailChanged ? data.email : undefined,
    phoneChanged ? data.phone : undefined,
    userId,
  );
  if (validation) return validation;

  user.first_name = data.first_name ?? user.first_name;
  user.last_name = data.last_name ?? user.last_name;
  user.country = data.country ?? user.country;
  user.timezone = data.timezone ?? user.timezone;
  user.phone = data.phone ?? user.phone;
  if (emailChanged) {
    user.email = data.email as string;
    user.email_verified = false;
  }
  user.status = (data?.status as UserStatus) ?? USER_STATUS.ACTIVE;
  user.two_factor_enabled =
    data.two_factor_enabled !== undefined
      ? Boolean(data.two_factor_enabled)
      : user.two_factor_enabled;

  if (data.image !== undefined) user.image = data.image;
  if (data.permission !== undefined) user.permission = data.permission;
  await saveUser(user);
  await invalidateUserCache(user.id);

  const newData = {
    first_name: user.first_name,
    last_name: user.last_name,
    country: user.country,
    timezone: user.timezone,
    phone: user.phone,
    email: user.email,
    image: user.image,
    permission: user.permission,
  };

  await logActivityData(activityType, user.id, clientInfo, oldData, newData);

  const freshUser = toSafeUser(await getUserById(userId));
  return {
    http_status: 200,
    status: 1,
    message: `${entityLabel} profile updated successfully`,
    data: freshUser,
  };
}

export async function updateImage(
  userId: string | number,
  file: Blob,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  if (!file || !(file instanceof Blob)) {
    return {
      http_status: 400,
      status: 0,
      message: "No image file uploaded",
      data: [],
    };
  }

  const validation = await validateFile(file, {
    maxSize: 5 * 1024 * 1024,
    allowedMimeTypes: MIME_IMAGE,
  });

  if (!validation.isValid) {
    return {
      http_status: 400,
      status: 0,
      message: validation.error || "Invalid file",
      data: [],
    };
  }

  const existing = await getUserById(userId);
  if (!existing) {
    return {
      http_status: 404,
      status: 0,
      message: "User not found",
      data: [],
    };
  }

  const previousImage = existing.image;

  const filename = await uploadFile(file, "profile");
  const updated = await updateUser(String(userId), {
    image: filename,
    updated_at: new Date(),
  });
  await invalidateUserCache(String(userId));
  const user = toSafeUser(updated);

  if (previousImage) {
    await deleteFile(previousImage, "profile").catch(() => {});
  }

  await logActivity("IMAGE_UPLOADED", String(userId), clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Profile image updated successfully",
    data: { image: getFileUrl(filename, "profile"), user },
  };
}

export async function deleteImage(userId: string | number): Promise<ApiResult> {
  const user = await getUserById(userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  if (!user.image) {
    return {
      http_status: 400,
      status: 0,
      message: "No profile image to delete",
    };
  }

  await deleteFile(user.image, "profile");

  user.image = "";
  await saveUser(user);

  await invalidateUserCache(user.id);

  return {
    http_status: 200,
    status: 1,
    message: "Profile image deleted successfully",
    data: { image: "" },
  };
}

export async function logoutAllSessions(
  userId: string | number,
  keepCurrentToken?: string,
): Promise<ApiResult> {
  const result = await deleteSessionsByUserExceptToken(
    String(userId),
    keepCurrentToken,
  );

  await Promise.all(result.map((r) => invalidateSessionCache(r.token)));

  const message = keepCurrentToken
    ? "All other sessions terminated successfully"
    : "All sessions terminated successfully";

  return {
    http_status: 200,
    status: 1,
    message,
    data: { sessionsTerminated: result.length },
  };
}

export async function logoutDevice(
  userId: string | number,
  sessionId: string,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  if (!sessionId) {
    return { http_status: 400, status: 0, message: "Session ID is required" };
  }

  const result = await deleteSessionByIdAndUser(sessionId, String(userId));

  if (!result) {
    return { http_status: 404, status: 0, message: "Session not found" };
  }

  await invalidateSessionCache(result.token);

  await logActivity("DEVICE_LOGGED_OUT", String(userId), clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Device logged out successfully",
  };
}

export async function logoutDeviceById(
  sessionId: string,
  clientInfo: ClientInfo,
  actorId?: string,
): Promise<ApiResult> {
  if (!sessionId) {
    return { http_status: 400, status: 0, message: "Session ID is required" };
  }

  const result = await deleteSessionById(sessionId);

  if (!result) {
    return { http_status: 404, status: 0, message: "Session not found" };
  }

  await invalidateSessionCache(result.token);

  if (actorId) {
    await logActivity("DEVICE_LOGGED_OUT", actorId, clientInfo);
  }

  return {
    http_status: 200,
    status: 1,
    message: "Device logged out successfully",
  };
}

export async function deactivate(
  userId: string | number,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const user = await getUserById(userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }
  user.status = USER_STATUS.INACTIVE;
  await saveUser(user);
  await invalidateUserCache(user.id);
  await logActivity("ACCOUNT_DEACTIVATE", user.id, clientInfo);
  return {
    http_status: 200,
    status: 1,
    message: "Account deactivated successfully",
  };
}

export async function activityList(
  userId: string | number,
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listUserActivity(String(userId));

  return paginate(query, body, userActivitySortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row: Record<string, unknown>) => ({
      ...row,
      type: USER_ACTIVITY[row.type as keyof typeof USER_ACTIVITY] || row.type,
      client: deviceName(row.client as string),
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

export async function sessionList(
  userId: string | number,
  body: PaginationInput,
  tz: string,
  currentDeviceUid = "",
): Promise<ApiResult> {
  const query = listSessionsByUser(String(userId));

  return paginate(query, body, sessionSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row: Record<string, unknown>) => {
      const isCurrentDevice = row.device_uid === currentDeviceUid;
      return {
        id: row.id,
        client:
          deviceName(row.user_agent as string) +
          (isCurrentDevice ? " (This Device)" : ""),
        ip: row.ip_address,
        last_activity: dateTimeFormat(row.updated_at as Date, tz),
        action: isCurrentDevice ? "" : "logout",
      };
    },
  });
}

export async function notesList(
  userId: string | number,
  body: PaginationInput,
): Promise<ApiResult> {
  const query = listNotes(String(userId));

  return paginate(query, body, noteSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row: Record<string, unknown>) => ({
      ...row,
    }),
  });
}

export async function activateAccount(
  userId: string | number,
  options: {
    entityLabel?: string;
    roleFilter?: readonly string[];
  } = {},
): Promise<ApiResult> {
  const { entityLabel = "Account", roleFilter } = options;

  const id = String(userId);

  const updated = await updateUserStatusWithRoleFilter(
    id,
    USER_STATUS.ACTIVE,
    roleFilter,
  );

  if (!updated) {
    return {
      http_status: 404,
      status: 0,
      message: `${entityLabel} not found`,
    };
  }

  await invalidateUserCache(id);

  return {
    http_status: 200,
    status: 1,
    message: `${entityLabel} activated successfully`,
    data: toSafeUser(updated),
  };
}

export async function deactivateAccount(
  userId: string | number,
  options: {
    entityLabel?: string;
    roleFilter?: readonly string[];
  } = {},
): Promise<ApiResult> {
  const { entityLabel = "Account", roleFilter } = options;

  const id = String(userId);

  const updated = await updateUserStatusWithRoleFilter(
    id,
    USER_STATUS.INACTIVE,
    roleFilter,
  );

  if (!updated) {
    return {
      http_status: 404,
      status: 0,
      message: `${entityLabel} not found`,
    };
  }

  await invalidateUserCache(id);

  return {
    http_status: 200,
    status: 1,
    message: `${entityLabel} deactivated successfully`,
    data: toSafeUser(updated),
  };
}

export async function deleteAccount(
  userId: string | number,
  options: {
    entityLabel?: string;
    roleFilter?: readonly string[];
    deleteSessions?: boolean;
  } = {},
): Promise<ApiResult> {
  const {
    entityLabel = "Account",
    roleFilter,
    deleteSessions = true,
  } = options;

  const id = String(userId);

  const user = await repoFindUserById(id);

  if (!user) {
    return {
      http_status: 404,
      status: 0,
      message: `${entityLabel} not found`,
    };
  }

  if (roleFilter?.length && !roleFilter.includes(user.role || "")) {
    return {
      http_status: 403,
      status: 0,
      message: "Forbidden",
    };
  }

  if (deleteSessions) {
    await deleteSessionsByUser(id);
  }

  await deleteUserById(id);
  await invalidateUserCache(id);

  return {
    http_status: 200,
    status: 1,
    message: `${entityLabel} deleted successfully`,
  };
}

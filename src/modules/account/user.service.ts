import { users, type IUser } from "@/models/schema";
import { USER_STATUS } from "@/modules/account/user.constants";
import type { UserStatus } from "@/modules/account/user.types";
import type { ApiResult } from "@/types";
import { getFileUrl } from "@/lib/file";
import {
  findUserById as repoFindUserById,
  findUserByEmail as repoFindUserByEmail,
  findUserByEmailOrPhone as repoFindUserByEmailOrPhone,
  findUserByEmailAndRole as repoFindUserByEmailAndRole,
  updateUser,
  insertUser,
  countUsers,
  updateUserReturning,
  insertUserReturning,
  listUsersPageColumns,
  findUserByIdColumns,
  deleteUserById,
} from "@/models/user.repository";

// Columns safe to return to clients (excludes secrets).
const safeUserColumns = {
  id: users.id,
  role: users.role,
  first_name: users.first_name,
  last_name: users.last_name,
  email: users.email,
  phone: users.phone,
  image: users.image,
  country: users.country,
  timezone: users.timezone,
  permission: users.permission,
  registered_ip: users.registered_ip,
  two_factor_enabled: users.two_factor_enabled,
  email_verified: users.email_verified,
  status: users.status,
  created_at: users.created_at,
  updated_at: users.updated_at,
};

/** Resolve a stored user image path to a fully qualified URL. */
export function resolveUserImage(image: string | null | undefined) {
  return image ? getFileUrl(image, "profile") : image;
}

// Whitelist of columns that may be written via the generic store().
const writableFields = [
  "role",
  "first_name",
  "last_name",
  "email",
  "phone",
  "image",
  "country",
  "timezone",
  "permission",
  "two_factor_enabled",
  "email_verified",
  "status",
] as const;

// Columns whose value is mirrored from the (possibly mutated) row on save().
const mutableColumns = [
  "role",
  "first_name",
  "last_name",
  "email",
  "phone",
  "image",
  "country",
  "timezone",
  "permission",
  "registered_ip",
  "two_factor_enabled",
  "email_verified",
  "status",
] as const;

export async function getUserById(id: string | number): Promise<IUser | null> {
  return repoFindUserById(id);
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
  return repoFindUserByEmail(email);
}

export async function getUserByEmailOrPhone(
  email?: string,
  phone?: string,
): Promise<IUser | null> {
  return repoFindUserByEmailOrPhone(email, phone);
}

export async function getUserByEmailAndRole(
  email: string,
  role: string,
): Promise<IUser | null> {
  return repoFindUserByEmailAndRole(email, role);
}

/** Persist the mutable columns of a user row. */
export async function saveUser(
  user: Partial<IUser> & { id: string },
): Promise<void> {
  const set: Record<string, unknown> = { updated_at: new Date() };
  for (const col of mutableColumns) {
    const value = user[col as keyof typeof user];
    set[col] = value === undefined ? null : value;
  }
  await updateUser(user.id, set);
}

/** Strip sensitive columns before returning a user to clients/caches. */
export function toSafeUser(user: IUser | null): Record<string, unknown> {
  if (!user) return {};
  const sanitized = { ...user } as Record<string, unknown>;
  sanitized.image = resolveUserImage(sanitized.image as string | null);
  return sanitized;
}

/** Create a new user and return the full row. */
export async function createUser(values: Partial<IUser>): Promise<IUser> {
  return insertUser(values as typeof users.$inferInsert);
}

function pickWritable(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of writableFields) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

export async function store(
  data: Record<string, unknown>,
  userId?: string | number,
): Promise<ApiResult> {
  if (userId) {
    const values = pickWritable(data);
    values.updated_at = new Date();
    const user = await updateUserReturning(
      String(userId),
      values,
      safeUserColumns,
    );
    if (!user) {
      return { http_status: 404, status: 0, message: "User not found" };
    }
    return {
      http_status: 200,
      status: 1,
      message: "User updated successfully",
      data: { user: toSafeUser(user as IUser) },
    };
  } else {
    const values = pickWritable(data);
    values.role = "USER";
    values.status = USER_STATUS.ACTIVE;
    const user = await insertUserReturning(
      values as typeof users.$inferInsert,
      safeUserColumns,
    );
    return {
      http_status: 201,
      status: 1,
      message: "User created successfully",
      data: { user: toSafeUser(user as IUser) },
    };
  }
}

export async function listUsers(page = 1, limit = 10): Promise<ApiResult> {
  const usersList = await listUsersPageColumns<IUser>(
    safeUserColumns,
    page,
    limit,
  );

  const total = await countUsers();

  return {
    http_status: 200,
    status: 1,
    message: "Users fetched successfully",
    data: {
      users: usersList.map((user) => toSafeUser(user)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
}

export async function getById(id: string | number): Promise<ApiResult> {
  const user = await findUserByIdColumns(id, safeUserColumns);
  if (!user) return { http_status: 404, status: 0, message: "User not found" };
  return {
    http_status: 200,
    status: 1,
    message: "User fetched successfully",
    data: toSafeUser(user as IUser),
  };
}

export async function updateStatus(
  id: string | number,
  statusValue: UserStatus,
): Promise<ApiResult> {
  const user = await updateUserReturning(
    String(id),
    { status: statusValue, updated_at: new Date() },
    safeUserColumns,
  );

  if (!user) return { http_status: 404, status: 0, message: "User not found" };
  return {
    http_status: 200,
    status: 1,
    message: `User ${statusValue} successfully`,
    data: toSafeUser(user as IUser),
  };
}

export async function deleteUser(id: string | number): Promise<ApiResult> {
  const deleted = await deleteUserById(String(id));
  if (!deleted)
    return { http_status: 404, status: 0, message: "User not found" };
  return {
    http_status: 200,
    status: 1,
    message: "User deleted successfully",
  };
}

import { and, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import db from "@/lib/db";
import { users, type IUser, type NewUser } from "@/models/user";

export const userSortMap: Record<string, PgColumn> = {
  name: users.first_name,
  email: users.email,
  phone: users.phone,
  status: users.status,
  created_at: users.created_at,
};

export const adminSortMap: Record<string, PgColumn> = {
  name: users.first_name,
  email: users.email,
  phone: users.phone,
  status: users.status,
  created_at: users.created_at,
};

export async function findUserById(id: string | number): Promise<IUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, String(id)))
    .limit(1);
  return row ?? null;
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row ?? null;
}

export async function findUserByPhone(phone: string): Promise<IUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  return row ?? null;
}

export async function findUserByEmailOrPhone(
  email?: string,
  phone?: string,
): Promise<IUser | null> {
  const conditions = [];
  if (email !== undefined) conditions.push(eq(users.email, email));
  if (phone !== undefined && phone !== null)
    conditions.push(eq(users.phone, phone));
  if (!conditions.length) return null;
  const [row] = await db
    .select()
    .from(users)
    .where(or(...conditions))
    .limit(1);
  return row ?? null;
}

export async function findUserByEmailAndRole(
  email: string,
  role: string,
): Promise<IUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(
      and(
        or(eq(users.email, email), eq(users.phone, email)),
        eq(users.role, role),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findUserSummaryById(
  id: string | number,
): Promise<Pick<IUser, "id" | "email" | "status" | "role"> | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, String(id)))
    .limit(1);
  return row ?? null;
}

export async function updateUser(
  id: string,
  values: Record<string, unknown>,
): Promise<IUser | null> {
  const [row] = await db
    .update(users)
    .set(values)
    .where(eq(users.id, id))
    .returning();
  return row ?? null;
}

export async function insertUser(values: NewUser): Promise<IUser> {
  const [row] = await db.insert(users).values(values).returning();
  return row;
}

export async function deleteUserById(id: string): Promise<boolean> {
  const [row] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return !!row;
}

export async function countUsers(): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  return count;
}

export async function listUsersPage(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return db
    .select()
    .from(users)
    .orderBy(desc(users.created_at))
    .limit(limit)
    .offset(skip);
}

/** Update a user and return only the given columns. */
export async function updateUserReturning<R>(
  id: string,
  values: Record<string, unknown>,
  columns: Record<string, PgColumn>,
): Promise<R | null> {
  const [row] = await db
    .update(users)
    .set(values)
    .where(eq(users.id, id))
    .returning(columns);
  return (row as R) ?? null;
}

/** Insert a user and return only the given columns. */
export async function insertUserReturning<R>(
  values: NewUser,
  columns: Record<string, PgColumn>,
): Promise<R> {
  const [row] = await db.insert(users).values(values).returning(columns);
  return row as R;
}

/** Select paginated users returning only the given columns. */
export async function listUsersPageColumns<R>(
  columns: Record<string, PgColumn>,
  page: number,
  limit: number,
): Promise<R[]> {
  const skip = (page - 1) * limit;
  const rows = await db
    .select(columns)
    .from(users)
    .orderBy(desc(users.created_at))
    .limit(limit)
    .offset(skip);
  return rows as R[];
}

/** Select a single user by id returning only the given columns. */
export async function findUserByIdColumns<R>(
  id: string | number,
  columns: Record<string, PgColumn>,
): Promise<R | null> {
  const [row] = await db
    .select(columns)
    .from(users)
    .where(eq(users.id, String(id)))
    .limit(1);
  return (row as R) ?? null;
}

/** Admin: list regular users (role = USER), search + filter applied by caller. */
export function listUsersByRole(
  role: string,
  search: string,
  filterWhere: ReturnType<typeof and> | undefined,
) {
  const conditions = [eq(users.role, role)];

  if (search.length > 2) {
    const like = `%${search}%`;
    const searchCond = or(
      ilike(sql`concat(${users.first_name}, ' ', ${users.last_name})`, like),
      ilike(users.email, like),
    );
    if (searchCond) conditions.push(searchCond);
  }

  if (filterWhere) conditions.push(filterWhere);

  return db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      phone: users.phone,
      image: users.image,
      status: users.status,
      created_at: users.created_at,
    })
    .from(users)
    .where(and(...conditions))
    .$dynamic();
}

/** Admin: list admin/super-admin accounts, search + filter applied by caller. */
export function listAdmins(
  roles: readonly string[],
  search: string,
  filterWhere: ReturnType<typeof and> | undefined,
) {
  const conditions = [inArray(users.role, [...roles])];

  if (search.length > 2) {
    const like = `%${search}%`;
    const searchCond = or(
      ilike(sql`concat(${users.first_name}, ' ', ${users.last_name})`, like),
      ilike(users.email, like),
    );
    if (searchCond) conditions.push(searchCond);
  }

  if (filterWhere) conditions.push(filterWhere);

  return db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      phone: users.phone,
      image: users.image,
      role: users.role,
      status: users.status,
      two_factor_enabled: users.two_factor_enabled,
      created_at: users.created_at,
    })
    .from(users)
    .where(and(...conditions))
    .$dynamic();
}

export async function findAdminProfileById(adminId: string | number) {
  const [row] = await db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      phone: users.phone,
      image: users.image,
      country: users.country,
      timezone: users.timezone,
      role: users.role,
      permission: users.permission,
      status: users.status,
      email_verified: users.email_verified,
      two_factor_enabled: users.two_factor_enabled,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users)
    .where(eq(users.id, String(adminId)))
    .limit(1);
  return row ?? null;
}

export async function groupUserCountsByCreatedAtLabel(
  label: ReturnType<typeof sql<string>>,
  since: Date,
  role: string,
): Promise<{ label: string; count: number }[]> {
  return db
    .select({ label, count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(gte(users.created_at, since), eq(users.role, role)))
    .groupBy(label)
    .orderBy(label);
}

export async function countUsersWhere(
  condition: ReturnType<typeof eq> | ReturnType<typeof and>,
): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(condition);
  return count;
}

export async function updateUserStatusWithRoleFilter(
  id: string,
  status: IUser["status"],
  roleFilter?: readonly string[],
): Promise<IUser | null> {
  const conditions = [eq(users.id, id)];
  if (roleFilter?.length) {
    conditions.push(inArray(users.role, [...roleFilter]));
  }
  const [row] = await db
    .update(users)
    .set({ status, updated_at: new Date() })
    .where(and(...conditions))
    .returning();
  return row ?? null;
}

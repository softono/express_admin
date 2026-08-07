import { and, eq, sql } from "drizzle-orm";
import { users } from "@/models/schema";
import { USER_ROLES } from "@/modules/account/user.constants";
import { USER_STATUS } from "@/modules/account/user.constants";
import {
  groupUserCountsByCreatedAtLabel,
  countUsersWhere,
} from "@/models/user.repository";

export async function getAdminChartUser(payload: {
  period?: string;
  months?: number;
}): Promise<{ label: string; count: number }[]> {
  let { period = "monthly", months } = payload ?? {};

  if (period === "day" || period === "daily") {
    period = "daily";
  } else if (period === "month" || period === "monthly" || period === "year") {
    period = "monthly";
  }

  if (!["daily", "monthly"].includes(period)) {
    throw new Error("Invalid period. Must be daily or monthly");
  }

  if (months === undefined) {
    months = period === "daily" ? 1 : 12;
  }

  const since = new Date();
  since.setMonth(since.getMonth() - Math.min(24, Math.max(1, months)));

  const label =
    period === "daily"
      ? sql<string>`to_char(${users.created_at}, 'YYYY-MM-DD')`
      : sql<string>`to_char(${users.created_at}, 'YYYY-MM')`;

  return groupUserCountsByCreatedAtLabel(label, since, USER_ROLES.USER);
}

export async function getAdminDashboardCounts(): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  const [total, active, inactive] = await Promise.all([
    countUsersWhere(eq(users.role, USER_ROLES.USER)),
    countUsersWhere(
      and(
        eq(users.role, USER_ROLES.USER),
        eq(users.status, USER_STATUS.ACTIVE),
      ),
    ),
    countUsersWhere(
      and(
        eq(users.role, USER_ROLES.USER),
        eq(users.status, USER_STATUS.INACTIVE),
      ),
    ),
  ]);

  return { total, active, inactive };
}

import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const userActivities = pgTable(
  "user_activities",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    device_id: text("device_id"),
    type: text("type"),
    data: text("data"),
    ip: text("ip"),
    client: text("client"),
    location: text("location"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("user_activity_user_idx").on(t.user_id)],
);

export type IUserActivity = typeof userActivities.$inferSelect;

export default userActivities;

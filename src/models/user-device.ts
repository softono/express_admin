import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const userDevices = pgTable(
  "user_devices",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    device_uid: text("device_uid").notNull(),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    trusted_at: timestamp("trusted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("user_devices_user_idx").on(t.user_id),
    index("user_devices_lookup_idx").on(t.user_id, t.device_uid),
  ],
);

export type IUserDevice = typeof userDevices.$inferSelect;

export default userDevices;

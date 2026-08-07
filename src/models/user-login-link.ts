import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const userLoginLinks = pgTable(
  "user_login_links",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    purpose: text("purpose").notNull(), // "signin" | "tfa"
    email: text("email").notNull(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    poll_token_hash: text("poll_token_hash").notNull(),
    link_token_hash: text("link_token_hash").notNull(),
    code: text("code").notNull(),
    status: text("status").notNull().default("pending"), // pending | approved | consumed | rejected | expired
    device_name: text("device_name"),
    location: text("location"),
    ip: text("ip"),
    remember: boolean("remember").default(false).notNull(),
    trust_device: boolean("trust_device").default(false).notNull(),
    tfa_handle: text("tfa_handle"),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    approved_at: timestamp("approved_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("user_login_links_user_idx").on(t.user_id),
    index("user_login_links_status_idx").on(t.status),
  ],
);

export type IUserLoginLink = typeof userLoginLinks.$inferSelect;
export type NewUserLoginLink = typeof userLoginLinks.$inferInsert;

export default userLoginLinks;

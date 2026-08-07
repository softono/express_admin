import { pgTable, pgEnum, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { USER_STATUS } from "@/modules/account/user.constants";

export const userStatusEnum = pgEnum("user_status", [
  USER_STATUS.ACTIVE,
  USER_STATUS.INACTIVE,
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  email_verified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  two_factor_enabled: boolean("two_factor_enabled").default(false),
  role: text("role").default("USER"),
  permission: text("permission"),
  status: userStatusEnum("status").default(USER_STATUS.ACTIVE),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  phone: text("phone"),
  country: text("country"),
  timezone: text("timezone").default("UTC"),
  registered_ip: text("registered_ip"),
});

export type IUser = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export default users;

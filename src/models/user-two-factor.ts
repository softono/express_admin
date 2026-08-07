import { pgTable, text, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const userTwoFactors = pgTable(
  "user_two_factors",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    secret: text("secret").notNull(),
    backup_codes: text("backup_codes").notNull(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    verified: boolean("verified").default(false),
  },
  (t) => [index("user_two_factors_userId_idx").on(t.user_id)],
);

export type IUserTwoFactor = typeof userTwoFactors.$inferSelect;

export default userTwoFactors;

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const userPasskeys = pgTable(
  "user_passkeys",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name"),
    public_key: text("public_key").notNull(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credential_id: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    device_type: text("device_type").notNull(),
    backed_up: boolean("backed_up").notNull(),
    transports: text("transports"),
    created_at: timestamp("created_at"),
    aaguid: text("aaguid"),
  },
  (t) => [
    index("user_passkey_userId_idx").on(t.user_id),
    index("user_passkey_credentialID_idx").on(t.credential_id),
  ],
);

export type IUserPasskey = typeof userPasskeys.$inferSelect;

export default userPasskeys;

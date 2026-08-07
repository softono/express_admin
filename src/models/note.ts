import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "@/models/user";

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("notes_user_idx").on(t.user_id)],
);

export type INote = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export default notes;

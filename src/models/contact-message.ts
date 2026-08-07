import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user";

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  to_user: text("to_user").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type IContactMessages = typeof contactMessages.$inferSelect;

export default contactMessages;

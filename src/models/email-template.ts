import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    title: text("title"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    params: text("params"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("email_templates_key_unique").on(t.key)],
);

export type IEmailTemplate = typeof emailTemplates.$inferSelect;

export default emailTemplates;

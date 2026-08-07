import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userStatusEnum } from "@/models/user";
import { USER_STATUS } from "@/modules/account/user.constants";

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    meta_title: text("meta_title"),
    meta_description: text("meta_description"),
    status: userStatusEnum("status").default(USER_STATUS.INACTIVE).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("pages_slug_unique").on(t.slug)],
);

export type IPage = typeof pages.$inferSelect;

export default pages;

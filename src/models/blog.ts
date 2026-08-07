import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { BLOG_STATUS } from "@/modules/blog/blog.constants";

export const statusEnum = pgEnum("status", [
  BLOG_STATUS.ACTIVE,
  BLOG_STATUS.INACTIVE,
]);

export const blogs = pgTable(
  "blogs",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    category: text("category").notNull(),
    image: text("image").default(""),
    meta_title: text("meta_title"),
    meta_description: text("meta_description"),
    status: statusEnum("status").default(BLOG_STATUS.ACTIVE).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("blogs_slug_unique").on(t.slug)],
);

export type IBlog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

export default blogs;

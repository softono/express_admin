import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const SEO_TYPE = {
  STATIC: "STATIC",
  DYNAMIC: "DYNAMIC",
} as const;

export type SeoType = (typeof SEO_TYPE)[keyof typeof SEO_TYPE];

export const seos = pgTable(
  "seos",
  {
    id: serial("id").primaryKey(),
    type: text("type").default("STATIC").notNull(),
    url: text("url").notNull(),
    title: text("title"),
    meta_title: text("meta_title"),
    keyword: text("keyword"),
    meta_keyword: text("meta_keyword"),
    description: text("description"),
    meta_description: text("meta_description"),
    image: text("image"),
    canonical: text("canonical"),
    last_modified: text("last_modified"),
    change_frequency: text("change_frequency"),
    priority: doublePrecision("priority"),
    status: integer("status").default(1).notNull(),
    sitemap_enable: integer("sitemap_enable").default(1).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("seos_url_unique").on(t.url)],
);

export type ISeo = typeof seos.$inferSelect;

export default seos;

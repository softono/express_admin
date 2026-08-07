import { and } from "drizzle-orm";
import { seos } from "@/models/schema";
import fs from "fs/promises";
import path from "path";
import clientConfig from "@/config";
import { paginate } from "@/lib/pagination";

import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/lib/pagination/pagination.validator";
import type { SeoMetaSaveInput } from "@/modules/seo/seo.validator";
import {
  buildFilter,
  type FilterMap,
} from "@/lib/pagination/buildFilter";
import { dateTimeFormat } from "@/lib/date";
import {
  listAdminSeo,
  buildSeoSearch,
  findSeoById,
  createSeo,
  updateSeo,
  deleteSeo,
  findAllEnabledSeo,
  seoSortMap,
} from "@/models/seo.repository";

const seoFilterMap: FilterMap = {
  url: { column: seos.url, type: "text" },
  title: { column: seos.title, type: "text" },
  keyword: { column: seos.keyword, type: "text" },
  sitemap_enable: { column: seos.status, type: "multiSelect" },
};

export async function listSeoMetas(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();

  const conditions = [];

  const searchWhere = buildSeoSearch(search);
  if (searchWhere) conditions.push(searchWhere);

  const filterWhere = buildFilter(seoFilterMap, body.filter);
  if (filterWhere) conditions.push(filterWhere);

  const query = listAdminSeo(
    conditions.length ? and(...conditions) : undefined,
  );

  return paginate(query, body, seoSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      sitemap_enable: row.status,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

export async function getAdminSeoMetaById(id: string): Promise<ApiResult> {
  const seo = await findSeoById(Number(id));
  if (!seo) {
    return { http_status: 404, status: 0, message: "SEO Meta not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "SEO Meta fetched successfully",
    data: { ...seo, sitemap_enable: seo.status },
  };
}

export async function createAdminSeoMeta(
  body: SeoMetaSaveInput,
): Promise<ApiResult> {
  const {
    url,
    title,
    keyword,
    description,
    last_modified,
    change_frequency,
    priority,
    sitemap_enable,
  } = body ?? {};

  const cleanUrl = String(url || "")
    .trim()
    .replace(/^\/+/, "");

  const seo = await createSeo({
    url: cleanUrl,
    title: String(title ?? ""),
    meta_title: String(title ?? ""),
    keyword: String(keyword ?? ""),
    meta_keyword: String(keyword ?? ""),
    description: String(description ?? ""),
    meta_description: String(description ?? ""),
    last_modified: String(last_modified ?? ""),
    change_frequency: String(change_frequency ?? "weekly"),
    priority: priority !== undefined ? Number(priority) : 0.5,
    status: sitemap_enable !== undefined ? Number(sitemap_enable) : 1,
  });

  return {
    http_status: 201,
    status: 1,
    message: "SEO Meta created successfully",
    data: seo,
  };
}

export async function updateAdminSeoMeta(
  id: string,
  body: Partial<SeoMetaSaveInput>,
): Promise<ApiResult> {
  const {
    url,
    title,
    keyword,
    description,
    last_modified,
    change_frequency,
    priority,
    sitemap_enable,
  } = body ?? {};

  const update: Record<string, unknown> = {};

  if (url !== undefined)
    update.url = String(url || "")
      .trim()
      .replace(/^\/+/, "");
  if (title !== undefined) {
    update.title = title;
    update.meta_title = title;
  }
  if (keyword !== undefined) {
    update.keyword = keyword;
    update.meta_keyword = keyword;
  }
  if (description !== undefined) {
    update.description = description;
    update.meta_description = description;
  }
  if (last_modified !== undefined) update.last_modified = last_modified;
  if (change_frequency !== undefined)
    update.change_frequency = change_frequency;
  if (priority !== undefined) update.priority = Number(priority);
  if (sitemap_enable !== undefined) update.status = Number(sitemap_enable);

  update.updated_at = new Date();

  const seo = await updateSeo(Number(id), update);
  if (!seo) {
    return { http_status: 404, status: 0, message: "SEO Meta not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "SEO Meta updated successfully",
    data: seo,
  };
}

export async function deleteAdminSeoMeta(id: string): Promise<ApiResult> {
  const seo = await deleteSeo(Number(id));
  if (!seo) {
    return { http_status: 404, status: 0, message: "SEO Meta not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "SEO Meta deleted successfully",
    data: seo,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generatePureSitemap(): Promise<{ entryCount: number }> {
  const items = await findAllEnabledSeo();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const baseUrl = (clientConfig.BASE_URL || "").replace(/\/+$/, "");

  for (const item of items) {
    const urlPath = String(item.url || "")
      .trim()
      .replace(/^\/+/, "");
    const priority = typeof item.priority === "number" ? item.priority : 0.5;
    const freq = item.change_frequency || "weekly";

    let lastmod = item.last_modified || "";
    if (lastmod) {
      lastmod = lastmod.replace("T", " ").split(" ")[0];
    } else {
      lastmod = new Date().toISOString().split("T")[0];
    }

    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${baseUrl}/${urlPath}`)}</loc>\n`;
    xml += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
    xml += `    <changefreq>${escapeXml(freq)}</changefreq>\n`;
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  const publicDir = path.join(process.cwd(), "public");
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), xml, "utf8");

  return { entryCount: items.length };
}

import { and } from "drizzle-orm";
import { emailTemplates } from "@/models/schema";
import { paginate } from "@/lib/pagination";

import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/lib/pagination/pagination.validator";
import {
  buildFilter,
  type FilterMap,
} from "@/lib/pagination/buildFilter";
import { dateTimeFormat } from "@/lib/date";
import {
  listAdminEmailTemplates,
  buildEmailTemplateSearch,
  findEmailTemplateById,
  updateEmailTemplateById,
  emailTemplateSortMap,
} from "@/models/email-template.repository";

const emailTemplateFilterMap: FilterMap = {
  title: { column: emailTemplates.title, type: "text" },
  subject: { column: emailTemplates.subject, type: "text" },
};

export async function listEmailTemplates(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();

  const conditions = [];

  const searchWhere = buildEmailTemplateSearch(search);
  if (searchWhere) conditions.push(searchWhere);

  const filterWhere = buildFilter(emailTemplateFilterMap, body.filter);
  if (filterWhere) conditions.push(filterWhere);

  const query = listAdminEmailTemplates(
    conditions.length ? and(...conditions) : undefined,
  );

  return paginate(query, body, emailTemplateSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (t) => ({
      ...t,
      title: t.title || t.key || "",
      created_at: dateTimeFormat(t.created_at as Date, tz),
    }),
  });
}

export async function getEmailTemplateById(
  id: string,
  tz: string,
): Promise<ApiResult> {
  const template = await findEmailTemplateById(Number(id));
  if (!template) {
    return { http_status: 404, status: 0, message: "Email template not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Email template details fetched successfully",
    data: {
      ...template,
      title: template.title || template.key || "",
      created_at: dateTimeFormat(template.created_at as Date, tz),
      updated_at: dateTimeFormat(template.updated_at as Date, tz),
    },
  };
}

export async function updateEmailTemplate(
  id: string,
  body: Record<string, unknown>,
  tz: string,
): Promise<ApiResult> {
  const update: Record<string, unknown> = {};
  const { title, subject, body: contentBody } = body ?? {};

  if (title !== undefined) update.title = title;
  if (subject !== undefined) update.subject = subject;
  if (contentBody !== undefined) update.body = contentBody;

  update.updated_at = new Date();

  const template = await updateEmailTemplateById(Number(id), update);
  if (!template) {
    return { http_status: 404, status: 0, message: "Email template not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Email template saved successfully",
    data: {
      ...template,
      title: template.title || template.key || "",
      created_at: dateTimeFormat(template.created_at as Date, tz),
      updated_at: dateTimeFormat(template.updated_at as Date, tz),
    },
  };
}

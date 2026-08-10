import type { Request, Response } from "express";
import { paginationBody } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import { getClientTimezone } from "@/lib/date";
import {
  getEmailTemplateById,
  listEmailTemplates,
  updateEmailTemplate,
} from "@/modules/email-template/email-template.service";
import { emailTemplateSaveSchema } from "@/modules/email-template/email-template.validator";
import { sendError, sendResult } from "@/utils/response";

export async function listEmailTemplatesController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listEmailTemplates(validated.data, getClientTimezone(req)));
}

export async function getEmailTemplateController(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!id) return sendError(res, 400, "Template ID is required");

  return sendResult(res, await getEmailTemplateById(id, getClientTimezone(req)));
}

export async function updateEmailTemplateController(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!id) return sendError(res, 400, "Template ID is required");

  const validated = validateData(emailTemplateSaveSchema.partial(), req.body ?? {});
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await updateEmailTemplate(id, validated.data, getClientTimezone(req)));
}

export async function saveEmailTemplateFileController(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!id) return sendError(res, 400, "Template ID is required");

  if (!req.file) return sendError(res, 400, "No file provided");
  if (req.file.size > 256 * 1024) {
    return sendError(res, 400, "File exceeds the 256KB limit");
  }

  const text = req.file.buffer.toString("utf8");
  return sendResult(res, await updateEmailTemplate(id, { body: text }, getClientTimezone(req)));
}

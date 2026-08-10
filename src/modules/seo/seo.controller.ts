import type { Request, Response } from "express";
import { paginationBody } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import {
  createAdminSeoMeta,
  deleteAdminSeoMeta,
  generatePureSitemap,
  getAdminSeoMetaById,
  listSeoMetas,
  updateAdminSeoMeta,
} from "@/modules/seo/seo.service";
import { seoMetaSaveSchema } from "@/modules/seo/seo.validator";
import { getClientTimezone } from "@/lib/date";
import { sendError, sendResponse, sendResult } from "@/utils/response";

export async function listSeoMetasController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listSeoMetas(validated.data, getClientTimezone(req)));
}

export async function createSeoMetaController(req: Request, res: Response) {
  const validated = validateData(seoMetaSaveSchema, req.body ?? {});
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await createAdminSeoMeta(validated.data));
}

export async function generateSitemapController(req: Request, res: Response) {
  const result = await generatePureSitemap();
  return sendResponse(res, 200, {
    status: 1,
    data: result,
    message: "Sitemap updated successfully",
  });
}

export async function getSeoMetaController(req: Request, res: Response) {
  return sendResult(res, await getAdminSeoMetaById(String(req.params.id)));
}

export async function updateSeoMetaController(req: Request, res: Response) {
  const id = String(req.params.id);
  const body = req.body ?? {};

  const action = body?.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(res, 400, "Invalid action");
    }
    return sendResult(
      res,
      await updateAdminSeoMeta(id, {
        sitemap_enable: action === "activate" ? 1 : 0,
      }),
    );
  }

  const validated = validateData(seoMetaSaveSchema.partial(), body);
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await updateAdminSeoMeta(id, validated.data));
}

export async function deleteSeoMetaController(req: Request, res: Response) {
  return sendResult(res, await deleteAdminSeoMeta(String(req.params.id)));
}

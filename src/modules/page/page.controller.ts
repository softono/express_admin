import type { Request, Response } from "express";
import { paginationBody } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import { getClientTimezone } from "@/lib/date";
import { USER_STATUS } from "@/modules/account/user.constants";
import { getAdminPageById, listPages, updateAdminPage } from "@/modules/page/pages.service";
import { pageSaveSchema, type PageSaveInput } from "@/modules/page/page.validator";
import { sendError, sendResponse, sendResult } from "@/utils/response";

export async function listPagesController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listPages(validated.data, getClientTimezone(req)));
}

export async function getPageController(req: Request, res: Response) {
  const id = String(req.params.id);
  return sendResult(res, await getAdminPageById(id, getClientTimezone(req)));
}

export async function updatePageController(req: Request, res: Response) {
  const id = String(req.params.id);
  const body = req.body ?? {};

  const action = body.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(res, 400, "Invalid action");
    }
    const data: Partial<PageSaveInput> = {
      status: action === "activate" ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE,
    };
    const result = await updateAdminPage(id, data, getClientTimezone(req));
    return sendResponse(res, 200, {
      status: 1,
      data: result?.data,
      message: `Page ${action === "activate" ? "activated" : "deactivated"} successfully`,
    });
  }

  const validated = validateData(pageSaveSchema, body);
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await updateAdminPage(id, validated.data, getClientTimezone(req)));
}

import type { Request, Response } from "express";
import { MIME_IMAGE, uploadFile, validateFile } from "@/lib/file";
import { paginationBody } from "@/lib/pagination";
import { paginationSchema } from "@/lib/pagination/pagination.validator";
import { validateData } from "@/lib/validator";
import { toFile } from "@/lib/upload";
import { getClientTimezone } from "@/lib/date";
import { USER_STATUS } from "@/modules/account/user.constants";
import {
  createAdminBlog,
  deleteAdminBlog,
  getAdminBlogById,
  listBlogs,
  updateAdminBlog,
} from "@/modules/blog/blog.service";
import { blogSaveSchema, type BlogSaveInput } from "@/modules/blog/blog.validator";
import { sendError, sendResponse, sendResult } from "@/utils/response";

function parseNumericId(id: string): number | null {
  const n = Number(id);
  return n && !isNaN(n) ? n : null;
}

export async function listBlogsController(req: Request, res: Response) {
  const validated = validateData(paginationSchema, paginationBody(req));
  if (!validated.status) return sendResult(res, validated);

  return sendResult(res, await listBlogs(validated.data, getClientTimezone(req)));
}

export async function createBlogController(req: Request, res: Response) {
  const validated = validateData(blogSaveSchema, req.body ?? {});
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "images");
  }

  const blog = await createAdminBlog(data, getClientTimezone(req));
  return sendResponse(res, 201, {
    status: 1,
    data: blog,
    message: "Blog created successfully",
  });
}

export async function getBlogController(req: Request, res: Response) {
  const id = parseNumericId(String(req.params.id));
  if (!id) return sendError(res, 400, "Invalid blog id");

  const blog = await getAdminBlogById(String(id), getClientTimezone(req));
  if (!blog) return sendError(res, 404, "Blog not found");

  return sendResponse(res, 200, {
    status: 1,
    data: blog,
    message: "Blog fetched successfully",
  });
}

export async function updateBlogController(req: Request, res: Response) {
  const id = parseNumericId(String(req.params.id));
  if (!id) return sendError(res, 400, "Invalid blog id");

  const fields = req.body ?? {};

  const action = fields.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(res, 400, "Invalid action");
    }
    const data: Partial<BlogSaveInput> = {
      status: action === "activate" ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE,
    };
    const blog = await updateAdminBlog(id, data, getClientTimezone(req));
    if (!blog) return sendError(res, 404, "Blog not found");

    return sendResponse(res, 200, {
      status: 1,
      data: blog,
      message: `Blog ${action === "activate" ? "activated" : "deactivated"} successfully`,
    });
  }

  const validated = validateData(blogSaveSchema.partial(), fields);
  if (!validated.status) return sendResult(res, validated);
  const data = validated.data;

  const image = toFile(req.file);
  if (image) {
    const validation = await validateFile(image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(res, 400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(image, "images");
  }

  const blog = await updateAdminBlog(id, data, getClientTimezone(req));
  if (!blog) return sendError(res, 404, "Blog not found");

  return sendResponse(res, 200, {
    status: 1,
    data: blog,
    message: "Blog updated successfully",
  });
}

export async function deleteBlogController(req: Request, res: Response) {
  const id = parseNumericId(String(req.params.id));
  if (!id) return sendError(res, 400, "Invalid blog id");

  const deleted = await deleteAdminBlog(id);
  if (!deleted) return sendError(res, 404, "Blog not found");

  return sendResponse(res, 200, {
    status: 1,
    data: deleted,
    message: "Blog deleted successfully",
  });
}

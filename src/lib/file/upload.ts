import crypto from "crypto";
import config from "@/config";
import { uploadLocal } from "./providers/local";
import { uploadS3 } from "./providers/s3";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
};

export async function uploadFile(
  file: Blob,
  type = "profile",
  subDir = "",
  name = "",
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  let filename = name;
  if (!filename) {
    // Extension comes from sniffed content, never the client-supplied type.
    const { fileTypeFromBuffer } = await import("file-type");
    const sniffed = await fileTypeFromBuffer(buffer);
    const ext = sniffed ? MIME_EXT[sniffed.mime] : undefined;
    if (!ext) {
      throw new Error("Unsupported file type");
    }
    filename = `${crypto
      .randomBytes(16)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 24)}.${ext}`;
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const resolvedSubDir = subDir || yearMonth;
  const relativePath = `${resolvedSubDir}/${filename}`;

  if (config.FILESYSTEM_DISK === "s3") {
    await uploadS3(buffer, relativePath, type);
  } else {
    await uploadLocal(buffer, resolvedSubDir, filename, type);
  }

  return relativePath;
}

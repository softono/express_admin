import { createHmac } from "crypto";
import config from "@/config";
import { getFilePath, getFileSystemPath } from "@/lib/file/path";

export function getFileUrl(
  file_name?: string | null | unknown,
  type = "profile",
  subDir = "",
  processing = "",
): string {
  if (!file_name) return "";
  const dir = subDir ? `${subDir.replace(/\/$/, "")}/` : "";
  const url = `${config.FILESYSTEM_URL}/${getFilePath(type)}${dir}${file_name}`;
  if (IMAGE_EXT_RE.test(url)) {
    return imageCacheUrl(url, processing);
  }
  return url;
}

export async function getPrivateFileUrl(
  file_name: string,
  type = "profile",
): Promise<string> {
  if (config.FILESYSTEM_DISK === "local") {
    const filePath = getFileSystemPath(type) + file_name;
    return `${config.BASE_URL}/file?p=${btoa(filePath)}`;
  } else {
    const { getS3PresignedUrl } = await import("./providers/s3");
    return getS3PresignedUrl(file_name, type);
  }
}

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)(\?.*)?$/i;

function imageCacheUrl(sourceUrl: string, processing = ""): string {
  if (config.IMGPROXY_ENABLED !== "true") return sourceUrl;

  const key = Buffer.from(config.IMGPROXY_KEY, "hex");
  const salt = Buffer.from(config.IMGPROXY_SALT, "hex");
  const base = config.IMGPROXY_URL.replace(/\/$/, "");

  const encodedSource = Buffer.from(sourceUrl).toString("base64url");
  const path =
    processing === ""
      ? `/${encodedSource}`
      : `/${processing.replace(/^\//, "")}/${encodedSource}`;
  const sig = createHmac("sha256", key)
    .update(Buffer.concat([salt, Buffer.from(path)]))
    .digest("base64url");

  return `${base}/${sig}${path}`;
}

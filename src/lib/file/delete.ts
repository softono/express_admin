import config from "@/config";
import { deleteLocal } from "./providers/local";
import { deleteS3 } from "./providers/s3";

export async function deleteFile(
  file_name: string,
  type = "profile",
): Promise<void> {
  if (config.FILESYSTEM_DISK === "s3") {
    await deleteS3(file_name, type);
  } else {
    await deleteLocal(file_name, type);
  }
}

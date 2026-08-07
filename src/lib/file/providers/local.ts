import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { getFileSystemPath } from "../path";

export async function uploadLocal(
  buffer: Buffer,
  resolvedSubDir: string,
  filename: string,
  type = "profile",
): Promise<void> {
  const dir = path.join(
    process.cwd(),
    "public",
    getFileSystemPath(type),
    resolvedSubDir,
  );
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
}

export async function deleteLocal(
  file_name: string,
  type = "profile",
): Promise<void> {
  const filePath = path.join(
    process.cwd(),
    "public",
    getFileSystemPath(type),
    file_name,
  );
  if (fsSync.existsSync(filePath)) {
    fsSync.unlinkSync(filePath);
  }
}

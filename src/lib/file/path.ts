import config from "@/config";

const FILE_PATH: Record<string, string> = {
  profile: "profile/",
  images: "assets/images/",
  temp: "temp/",
};

export function getFilePath(type = "profile"): string {
  return FILE_PATH[type] || FILE_PATH.temp;
}

export function getFileSystemPath(type = "profile"): string {
  if (config.FILESYSTEM_DISK === "local") {
    return config.FILESYSTEM_PATH + getFilePath(type);
  } else {
    return getFilePath(type);
  }
}

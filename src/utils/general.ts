export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomAlnum(length: number): string {
  const ALNUM =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);

  crypto.getRandomValues(array);

  return Array.from(array)
    .map((b) => ALNUM[b % ALNUM.length])
    .join("");
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBrowserdeviceName(userAgent: string = ""): string {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  if (ua.includes("edg")) return "Microsoft Edge";
  if (ua.includes("chrome")) return "Google Chrome";
  if (ua.includes("firefox")) return "Mozilla Firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("opera") || ua.includes("opr/")) return "Opera";

  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return "Android Device";
  if (ua.includes("windows")) return "Windows PC";
  if (ua.includes("macintosh") || ua.includes("mac os")) return "Mac";
  if (ua.includes("linux")) return "Linux";

  return userAgent;
}

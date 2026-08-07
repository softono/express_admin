const env = process.env;

const trimSlash = (value: string = ""): string => value.replace(/\/+$/, "");
const normalizeUrl = (value?: string, fallback: string = ""): string =>
  trimSlash((value || fallback).trim());

const appOrigin = normalizeUrl(env.APP_URL || "http://localhost:5174");
const apiOrigin = normalizeUrl(env.API_URL || "http://localhost:4001");

const config = {
  APP_NAME: env.APP_NAME || "Next",
  APP_UID: env.APP_UID || "next",
  APP_LOGO: env.APP_LOGO || "",
  BASE_URL: env.BASE_URL || appOrigin,
  // Frontend origin — used in email links and OAuth final redirects.
  APP_URL: appOrigin,
  // Own origin — used to build file URLs.
  API_URL: apiOrigin,
  PORT: Number(env.PORT) || 4001,
  APP_ENV: env.APP_ENV || "development",
  APP_DEBUG: env.APP_DEBUG === "true",
  CORS_ORIGIN: env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(",").map((v) => v.trim())
    : [appOrigin].filter(Boolean),
  DATABASE_URL: env.DATABASE_URL || "",
  ENCRYPTION_KEY: env.ENCRYPTION_KEY || "",
  REDIS_URL: env.REDIS_URL || "",
  CACHE_DRIVER: env.CACHE_DRIVER || "memory",

  FILESYSTEM_DISK: env.FILESYSTEM_DISK || "local",
  FILESYSTEM_PATH: env.FILESYSTEM_PATH || ".",
  FILESYSTEM_URL: normalizeUrl(env.FILESYSTEM_URL, apiOrigin),
  AWS_REGION: env.AWS_REGION || "us-east-1",
  AWS_BUCKET: env.AWS_BUCKET || "",
  AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY || "",
  AWS_URL: normalizeUrl(env.AWS_URL),
  AWS_ENDPOINT: normalizeUrl(env.AWS_ENDPOINT),
  IMGPROXY_ENABLED: env.IMGPROXY_ENABLED || "false",
  IMGPROXY_KEY: env.IMGPROXY_KEY || "",
  IMGPROXY_SALT: env.IMGPROXY_SALT || "",
  IMGPROXY_URL: env.IMGPROXY_URL || "",

  WEBAUTHN_RP_ID: env.WEBAUTHN_RP_ID || "localhost",
  WEBAUTHN_ORIGIN: normalizeUrl(env.WEBAUTHN_ORIGIN, appOrigin),

  OTP_EXPIRE_SEC: 600,
  LOGIN_LINK_EXPIRE_SEC: 300,
};

function validateConfig(cfg: typeof config) {
  const required: string[] = ["DATABASE_URL", "ENCRYPTION_KEY"];

  if (cfg.CACHE_DRIVER?.toLowerCase() === "redis") {
    required.push("REDIS_URL");
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (cfg.ENCRYPTION_KEY.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters");
  }
}

validateConfig(config);

export default config;

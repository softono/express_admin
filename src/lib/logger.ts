import pino from "pino";
import config from "@/config";

const targets: pino.TransportTargetOptions[] = [
  {
    target: "pino-roll",
    options: {
      file: "logs/error",
      frequency: "daily",
      extension: ".log",
      mkdir: true,
    },
    level: "error",
  },
  {
    target: "pino-roll",
    options: {
      file: "logs/combined",
      frequency: "daily",
      extension: ".log",
      mkdir: true,
    },
    level: "info",
  },
];

if (config.APP_ENV !== "production") {
  targets.push({
    target: "pino/file",
    options: { destination: 1 },
    level: "info",
  });
}

const logger = pino(
  {
    level: "info",
    redact: {
      paths: [
        "password",
        "token",
        "secret",
        "secretKey",
        "jwt",
        "authorization",
        "*.password",
        "*.token",
        "*.secret",
      ],
      censor: "[REDACTED]",
    },
  },
  pino.transport({ targets }),
);

export function errorLog(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    logger.error(meta, message);
  } else {
    logger.error(message);
  }
}

export function infoLog(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    logger.info(meta, message);
  } else {
    logger.info(message);
  }
}

export function warningLog(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    logger.warn(meta, message);
  } else {
    logger.warn(message);
  }
}

export function debugLog(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    logger.debug(meta, message);
  } else {
    logger.debug(message);
  }
}

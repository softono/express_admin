import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import config from "@/config";
import { deviceCookie } from "@/middleware/deviceCookie";
import { errorHandler, notFound } from "@/middleware/errorHandler";
import { apiRateLimit } from "@/middleware/rateLimit";
import routes from "@/routes";

const app = express();

app.set("trust proxy", true);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    exposedHeaders: [
      "Retry-After",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(deviceCookie);
app.use(apiRateLimit);

app.use(express.static("public"));
app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;

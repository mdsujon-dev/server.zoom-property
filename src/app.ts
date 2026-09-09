import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import morgan from "morgan";
import os from "os";
import path from "path";
import { actionLogger } from "./app/middleware/actionLogger";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import { apiRateLimit } from "./app/middleware/rateLimit";
import router from "./app/routes";
import { UploadRoutes } from "./app/routes/upload.route";
import { corsOptions } from "./app/utils/cors";
import sendResponse from "./app/utils/sendResponse";
import config from "./app/config";

const app: Application = express();
app.set("trust proxy", 1);

const getLeadIp = (req: Request): string => {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0]!.trim();
  if (Array.isArray(xf)) return xf[0]!.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "unknown";
};

const formatUptime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return {
    totalSeconds: Math.floor(totalSeconds),
    formatted: `${h}h ${m}m ${s}s`,
  };
};

// Middleware setup
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

// Kept first, ahead of every route and limiter, so that a 401, a 429 or a
// thrown error still comes back with CORS headers on it. An error response the
// browser refuses to read is reported as a CORS failure, which sends everyone
// hunting the wrong problem.
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static folder for image access
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("", UploadRoutes);
app.use("/api", apiRateLimit, actionLogger, router);

// seedAdmin();

app.get("/", (req: Request, res: Response, _next: NextFunction) => {
  const serverUptime = os.uptime();
  const uptime = formatUptime(serverUptime);
  const env = process.env.NODE_ENV ?? "development";

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message:
      "Welcome to Zoom Property Management API. The API is healthy and ready to serve requests.",
    data: {
      api: {
        name: "Zoom Property Management Backend",
        version: "1.0.1",
        basePath: "/api",
      },
      request: {
        leadIp: getLeadIp(req),
        receivedAt: new Date().toISOString(),
      },
      runtime: {
        environment: env,
        uptime,
        host: os.hostname(),
        platform: os.platform(),
      },
      support: {
        email: config.sender_email,
        website: config.frontend_url,
      },
    },
  });
});

app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app; // Export the app for use in server.ts

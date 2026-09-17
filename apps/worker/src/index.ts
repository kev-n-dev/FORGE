/**
 * FORGE API Worker — Cloudflare Workers entry point.
 * Built with Hono for lightweight, edge-native routing.
 */

import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import type { Env, HonoVariables } from "./types";
import { buildCors } from "./middleware/cors";
import { requestId } from "./middleware/requestId";
import { globalErrorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { profilesRouter } from "./routes/profiles";
import { projectsRouter } from "./routes/projects";
import { reviewsRouter } from "./routes/reviews";
import { searchRouter } from "./routes/search";
import { adminRouter } from "./routes/admin";
import { configRouter } from "./routes/config";

const app = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// CORS — must run before auth
app.use("*", async (c, next) => {
  const corsMw = buildCors(c.env);
  return corsMw(c, next);
});

// Request ID for tracing
app.use("*", requestId);

// Security headers
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  })
);

// Development request logger
app.use("*", logger());

// ---------------------------------------------------------------------------
// Health check (no auth)
// ---------------------------------------------------------------------------
app.get("/health", (c) =>
  c.json({ status: "ok", service: "forge-api", timestamp: new Date().toISOString() })
);

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.route("/api/config", configRouter);
app.route("/api/auth", authRouter);
app.route("/api/profiles", profilesRouter);
app.route("/api/projects", projectsRouter);
app.route("/api/reviews", reviewsRouter);
app.route("/api/search", searchRouter);
app.route("/api/admin", adminRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.notFound((c) =>
  c.json({ success: false, error: { code: "NOT_FOUND", message: "Route not found." } }, 404)
);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.onError(globalErrorHandler);

export default app;

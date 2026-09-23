/**
 * The Guild API Worker — Cloudflare Workers entry point.
 * Built with Hono for lightweight, edge-native routing.
 *
 * Architecture:
 *   /api/*   → Hono API routes (Worker logic)
 *   /health  → Health check
 *   /*       → Static assets (React frontend via Workers Static Assets)
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
import { notificationsRouter } from "./routes/notifications";
import { reportsRouter } from "./routes/reports";
import { messagesRouter } from "./routes/messages";

const app = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use("*", async (c, next) => {
  const corsMw = buildCors(c.env);
  return corsMw(c, next);
});

app.use("*", requestId);

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

app.use("*", logger());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (c) =>
  c.json({ status: "ok", service: "guild-api", timestamp: new Date().toISOString() })
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
app.route("/api/notifications", notificationsRouter);
app.route("/api/reports", reportsRouter);
app.route("/api/messages", messagesRouter);

// ---------------------------------------------------------------------------
// Frontend — fall through to static assets for all non-API routes.
// This serves the React SPA and handles client-side routing (all paths
// return index.html so TanStack Router can take over).
// ---------------------------------------------------------------------------
app.get("*", async (c) => {
  // ASSETS binding is provided by Workers Static Assets ([assets] in wrangler.toml)
  const url = new URL(c.req.url);

  // Try the exact path first (JS, CSS, images, etc.)
  let response = await c.env.ASSETS.fetch(c.req.raw);

  // For non-file paths (no extension), serve index.html so the SPA router works
  if (response.status === 404 && !url.pathname.includes(".")) {
    const indexUrl = new URL("/index.html", url.origin);
    response = await c.env.ASSETS.fetch(new Request(indexUrl));
  }

  return response;
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.onError(globalErrorHandler);

export default app;

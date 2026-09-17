/**
 * Auth route integration tests — run against a local Miniflare instance.
 */
import { describe, it, expect } from "vitest";
import app from "../index";

// Minimal stub env for unit-level route tests
const mockEnv = {
  ENVIRONMENT: "development" as const,
  AUTH_SECRET: "test-secret-32-chars-minimum-len!",
  TURNSTILE_SECRET: "1x0000000000000000000000000000000AA", // always-pass test key
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  MEDIA_BASE_URL: "http://localhost",
};

describe("GET /health", () => {
  it("returns 200 ok", async () => {
    const req = new Request("http://localhost/health");
    const res = await app.fetch(req, mockEnv as never, {} as ExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});

describe("POST /api/auth/register — validation", () => {
  it("returns 422 for missing fields", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad" }),
    });
    const res = await app.fetch(req, mockEnv as never, {} as ExecutionContext);
    expect(res.status).toBe(422);
    const body = await res.json() as { success: boolean };
    expect(body.success).toBe(false);
  });
});

describe("POST /api/auth/login — validation", () => {
  it("returns 422 for empty body", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await app.fetch(req, mockEnv as never, {} as ExecutionContext);
    expect(res.status).toBe(422);
  });
});

describe("GET /api/admin/users — unauthenticated", () => {
  it("returns 401", async () => {
    const req = new Request("http://localhost/api/admin/users");
    const res = await app.fetch(req, mockEnv as never, {} as ExecutionContext);
    expect(res.status).toBe(401);
  });
});

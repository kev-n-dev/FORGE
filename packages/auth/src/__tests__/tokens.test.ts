import { describe, it, expect } from "vitest";
import { generateToken, hashToken, isExpired, expiresInMinutes } from "../tokens";

describe("generateToken()", () => {
  it("returns a 64-char hex raw token", async () => {
    const { raw } = await generateToken();
    expect(raw).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(raw)).toBe(true);
  });

  it("produces different tokens each call", async () => {
    const a = await generateToken();
    const b = await generateToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hash is consistent for the same raw token", async () => {
    const { raw } = await generateToken();
    const h1 = await hashToken(raw);
    const h2 = await hashToken(raw);
    expect(h1).toBe(h2);
  });
});

describe("isExpired()", () => {
  it("returns false for a future time", () => {
    expect(isExpired(expiresInMinutes(10))).toBe(false);
  });

  it("returns true for a past time", () => {
    expect(isExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
  });
});

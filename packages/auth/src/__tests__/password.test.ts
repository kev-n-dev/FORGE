import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, needsRehash } from "../password";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("Secure123!");
    expect(hash).toMatch(/^pbkdf2:sha-256:/);
    expect(await verifyPassword("Secure123!", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("Secure123!");
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const h1 = await hashPassword("SamePassword1");
    const h2 = await hashPassword("SamePassword1");
    expect(h1).not.toBe(h2);
  });

  it("returns false for a malformed hash", async () => {
    expect(await verifyPassword("anything", "not:a:real:hash")).toBe(false);
  });
});

describe("needsRehash", () => {
  it("returns false for a fresh hash", async () => {
    const hash = await hashPassword("Test1234");
    expect(needsRehash(hash)).toBe(false);
  });

  it("returns true for a malformed stored value", () => {
    expect(needsRehash("garbage")).toBe(true);
  });
});

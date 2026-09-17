import { describe, it, expect } from "vitest";
import { can, isAdmin, isProfessional, assertOwnerOrAdmin, AuthorizationError } from "../rbac";
import { UserRole } from "@forge/types";

describe("can()", () => {
  it("customer can create reviews", () => {
    expect(can(UserRole.Customer, "review:create")).toBe(true);
  });

  it("customer cannot remove reviews", () => {
    expect(can(UserRole.Customer, "review:remove:admin")).toBe(false);
  });

  it("professional can respond to reviews", () => {
    expect(can(UserRole.Professional, "review:respond:own")).toBe(true);
  });

  it("professional cannot remove reviews (admin only)", () => {
    expect(can(UserRole.Professional, "review:remove:admin")).toBe(false);
  });

  it("admin can access admin panel", () => {
    expect(can(UserRole.Admin, "admin:access")).toBe(true);
  });

  it("admin can remove reviews", () => {
    expect(can(UserRole.Admin, "review:remove:admin")).toBe(true);
  });

  it("super admin can access super admin features", () => {
    expect(can(UserRole.SuperAdmin, "superadmin:access")).toBe(true);
  });

  it("customer cannot access admin panel", () => {
    expect(can(UserRole.Customer, "admin:access")).toBe(false);
  });
});

describe("isAdmin()", () => {
  it("returns true for admin", () => expect(isAdmin(UserRole.Admin)).toBe(true));
  it("returns true for super_admin", () => expect(isAdmin(UserRole.SuperAdmin)).toBe(true));
  it("returns false for customer", () => expect(isAdmin(UserRole.Customer)).toBe(false));
  it("returns false for professional", () => expect(isAdmin(UserRole.Professional)).toBe(false));
});

describe("assertOwnerOrAdmin()", () => {
  it("passes when actor is the owner", () => {
    expect(() => assertOwnerOrAdmin("u1", "u1", UserRole.Customer)).not.toThrow();
  });

  it("passes when actor is an admin", () => {
    expect(() => assertOwnerOrAdmin("admin-id", "other-id", UserRole.Admin)).not.toThrow();
  });

  it("throws when actor is not owner and not admin", () => {
    expect(() =>
      assertOwnerOrAdmin("u1", "u2", UserRole.Professional)
    ).toThrow(AuthorizationError);
  });
});

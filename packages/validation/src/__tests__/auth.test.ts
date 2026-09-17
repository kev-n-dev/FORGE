import { describe, it, expect } from "vitest";
import { LoginSchema, RegisterSchema, PasswordResetRequestSchema } from "../auth";
import { UserRole } from "@forge/types";

describe("LoginSchema", () => {
  it("accepts valid credentials", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      turnstileToken: "token123",
    });
    expect(result.success).toBe(true);
  });

  it("normalises email to lowercase", () => {
    const result = LoginSchema.safeParse({
      email: "USER@EXAMPLE.COM",
      password: "Password123",
      turnstileToken: "token123",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
      turnstileToken: "token123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "",
      turnstileToken: "token123",
    });
    expect(result.success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  const validRegister = {
    email: "new@example.com",
    password: "Secure123",
    confirmPassword: "Secure123",
    firstName: "Jane",
    lastName: "Doe",
    role: UserRole.Professional,
    turnstileToken: "token123",
  };

  it("accepts valid registration", () => {
    const result = RegisterSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = RegisterSchema.safeParse({ ...validRegister, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejects weak password", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister,
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("rejects admin role during registration", () => {
    const result = RegisterSchema.safeParse({ ...validRegister, role: UserRole.Admin });
    expect(result.success).toBe(false);
  });
});

describe("PasswordResetRequestSchema", () => {
  it("accepts valid email and token", () => {
    const result = PasswordResetRequestSchema.safeParse({
      email: "user@example.com",
      turnstileToken: "token",
    });
    expect(result.success).toBe(true);
  });
});

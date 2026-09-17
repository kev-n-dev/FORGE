import { z } from "zod";
import { UserRole } from "@forge/types";
import { zEmail, zPassword, zTurnstileToken } from "./common";

export const LoginSchema = z.object({
  email: zEmail,
  password: z.string().min(1, "Password is required").max(128),
  turnstileToken: zTurnstileToken,
});

export const RegisterSchema = z
  .object({
    email: zEmail,
    password: zPassword,
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required").max(64).trim(),
    lastName: z.string().min(1, "Last name is required").max(64).trim(),
    role: z.enum([UserRole.Customer, UserRole.Professional] as [
      UserRole.Customer,
      UserRole.Professional,
    ]),
    turnstileToken: zTurnstileToken,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const PasswordResetRequestSchema = z.object({
  email: zEmail,
  turnstileToken: zTurnstileToken,
});

export const PasswordResetConfirmSchema = z
  .object({
    token: z.string().min(1),
    password: zPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: zPassword,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const EmailVerificationSchema = z.object({
  token: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

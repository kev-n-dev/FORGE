import type { AccountStatus, UserRole } from "./enums";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  status: AccountStatus;
  createdAt: string; // ISO 8601
  updatedAt: string;
  lastLoginAt: string | null;
  mfaEnabled: boolean;
}

export interface UserSession {
  userId: string;
  role: UserRole;
  email: string;
  sessionId: string;
  expiresAt: number; // Unix timestamp
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole.Customer | UserRole.Professional;
  turnstileToken: string;
}

export interface PasswordResetRequest {
  email: string;
  turnstileToken: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

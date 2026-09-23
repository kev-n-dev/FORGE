/**
 * Authentication routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * POST /api/auth/refresh
 * POST /api/auth/verify-email
 * POST /api/auth/password-reset/request
 * POST /api/auth/password-reset/confirm
 * POST /api/auth/change-password (authenticated)
 */

import { Hono } from "hono";
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  createAccessToken,
  createRefreshToken,
  verifyToken,
  createSession,
  getSession,
  validateRefreshToken,
  rotateRefreshToken,
  deleteSession,
  registerSessionForUser,
  deleteAllUserSessions,
  generateToken,
  hashToken,
  generateSessionId,
  expiresInHours,
  isExpired,
  verifyTurnstile,
} from "@guild/auth";
import type { RefreshTokenPayload } from "@guild/auth";
import { UserRole } from "@guild/types";
import {
  LoginSchema,
  RegisterSchema,
  PasswordResetRequestSchema,
  PasswordResetConfirmSchema,
  ChangePasswordSchema,
  EmailVerificationSchema,
} from "@guild/validation";
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserLastLogin,
  markEmailVerified,
  updatePasswordHash,
  createEmailVerificationToken,
  findEmailVerificationToken,
  consumeEmailVerificationToken,
  createPasswordResetToken,
  findPasswordResetToken,
  consumePasswordResetToken,
  createProfessionalProfile,
} from "@guild/database";
import { generateSlug } from "@guild/config";
import type { Env, HonoVariables } from "../types";
import { ok, err } from "../utils/response";
import { validate } from "../utils/validate";
import { authRateLimit } from "../middleware/ratelimit";
import { requireAuth } from "../middleware/auth";

const auth = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

auth.use("*", authRateLimit);

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(RegisterSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const { email, password, firstName, lastName, role, turnstileToken } = parsed.data;

  // Verify Turnstile
  const ip = c.req.header("CF-Connecting-IP");
  const ts = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, ip);
  if (!ts.success) return err(c, "CAPTCHA_FAILED", "CAPTCHA verification failed.", 400);

  // Check duplicate email
  const existing = await findUserByEmail(c.env.DB, email);
  if (existing) return err(c, "EMAIL_EXISTS", "An account with this email already exists.", 409);

  // Create user
  const passwordHash = await hashPassword(password);
  const user = await createUser(c.env.DB, { email, passwordHash, role });

  // Create professional profile if registering as professional
  if (role === UserRole.Professional) {
    const displayName = `${firstName} ${lastName}`;
    const slug = generateSlug(displayName);
    await createProfessionalProfile(c.env.DB, {
      userId: user.id,
      displayName,
      profileSlug: slug,
    });
  }

  // Send email verification token (queue for async email send)
  const { raw, hash } = await generateToken();
  await createEmailVerificationToken(c.env.DB, user.id, hash, expiresInHours(24));

  // In production, enqueue email send. For now, include in response for dev.
  const verificationUrl =
    c.env.ENVIRONMENT !== "production"
      ? `/verify-email?token=${raw}`
      : undefined;

  return ok(
    c,
    {
      message: "Account created. Please check your email to verify your account.",
      userId: user.id,
      ...(verificationUrl ? { verificationUrl } : {}),
    },
    201
  );
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify-email
// ---------------------------------------------------------------------------
auth.post("/verify-email", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(EmailVerificationSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const tokenHash = await hashToken(parsed.data.token);
  const record = await findEmailVerificationToken(c.env.DB, tokenHash);

  if (!record) return err(c, "INVALID_TOKEN", "Invalid or expired verification link.", 400);
  if (isExpired(record.expires_at)) {
    return err(c, "TOKEN_EXPIRED", "Verification link has expired. Please request a new one.", 400);
  }

  await consumeEmailVerificationToken(c.env.DB, record.id);
  await markEmailVerified(c.env.DB, record.user_id);

  return ok(c, { message: "Email verified successfully." });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(LoginSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const { email, password, turnstileToken } = parsed.data;

  const ip = c.req.header("CF-Connecting-IP");
  const ts = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, ip);
  if (!ts.success) return err(c, "CAPTCHA_FAILED", "CAPTCHA verification failed.", 400);

  const user = await findUserByEmail(c.env.DB, email);
  // Use the same error message for missing user and wrong password (prevent enumeration)
  if (!user) {
    return err(c, "INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return err(c, "INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  if (user.status === "suspended") {
    return err(c, "ACCOUNT_SUSPENDED", "Your account has been suspended.", 403);
  }
  if (user.status === "banned") {
    return err(c, "ACCOUNT_BANNED", "Your account has been permanently banned.", 403);
  }

  // Rehash password if needed (e.g. iteration count increased)
  if (needsRehash(user.password_hash)) {
    const newHash = await hashPassword(password);
    await updatePasswordHash(c.env.DB, user.id, newHash);
  }

  const sessionId = generateSessionId();
  const role = user.role as UserRole;

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken({ userId: user.id, email: user.email, role, sessionId }, c.env.AUTH_SECRET),
    createRefreshToken({ userId: user.id, sessionId }, c.env.AUTH_SECRET),
  ]);

  await Promise.all([
    createSession(c.env.SESSION_KV, {
      userId: user.id,
      email: user.email,
      role,
      sessionId,
      refreshToken,
      userAgent: c.req.header("User-Agent") ?? null,
      ip: ip ?? null,
    }),
    registerSessionForUser(c.env.SESSION_KV, user.id, sessionId),
    updateUserLastLogin(c.env.DB, user.id),
  ]);

  return ok(c, {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes
    user: {
      id: user.id,
      email: user.email,
      role,
      emailVerified: user.email_verified === 1,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
auth.post("/refresh", async (c) => {
  const body = await c.req.json().catch(() => null);
  const refreshToken = (body as { refreshToken?: string } | null)?.refreshToken;
  if (!refreshToken) return err(c, "MISSING_TOKEN", "Refresh token is required.", 400);

  const payload = await verifyToken<RefreshTokenPayload>(refreshToken, c.env.AUTH_SECRET);
  if (!payload || payload.type !== "refresh") {
    return err(c, "INVALID_TOKEN", "Invalid or expired refresh token.", 401);
  }

  const session = await validateRefreshToken(
    c.env.SESSION_KV,
    payload.sessionId,
    refreshToken
  );
  if (!session) {
    // Possible token theft — session already invalidated
    return err(c, "SESSION_INVALID", "Session is no longer valid. Please log in again.", 401);
  }

  const user = await findUserById(c.env.DB, session.userId);
  if (!user || user.status !== "active") {
    await deleteSession(c.env.SESSION_KV, payload.sessionId);
    return err(c, "ACCOUNT_INACTIVE", "Account is not active.", 401);
  }

  const [newAccessToken, newRefreshToken] = await Promise.all([
    createAccessToken(
      { userId: user.id, email: user.email, role: user.role as UserRole, sessionId: payload.sessionId },
      c.env.AUTH_SECRET
    ),
    createRefreshToken({ userId: user.id, sessionId: payload.sessionId }, c.env.AUTH_SECRET),
  ]);

  await rotateRefreshToken(c.env.SESSION_KV, payload.sessionId, newRefreshToken);

  return ok(c, { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
auth.post("/logout", requireAuth, async (c) => {
  await deleteSession(c.env.SESSION_KV, c.get("sessionId"));
  return ok(c, { message: "Logged out successfully." });
});

// ---------------------------------------------------------------------------
// POST /api/auth/password-reset/request
// ---------------------------------------------------------------------------
auth.post("/password-reset/request", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(PasswordResetRequestSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const ip = c.req.header("CF-Connecting-IP");
  const ts = await verifyTurnstile(parsed.data.turnstileToken, c.env.TURNSTILE_SECRET, ip);
  if (!ts.success) return err(c, "CAPTCHA_FAILED", "CAPTCHA verification failed.", 400);

  // Always return the same message — prevents email enumeration
  const user = await findUserByEmail(c.env.DB, parsed.data.email);
  if (user && user.status === "active") {
    const { raw, hash } = await generateToken();
    await createPasswordResetToken(c.env.DB, user.id, hash, expiresInHours(1));
    // In production: enqueue email with reset link containing `raw`
    if (c.env.ENVIRONMENT !== "production") {
      return ok(c, {
        message: "If an account exists, a reset link has been sent.",
        resetUrl: `/reset-password?token=${raw}`,
      });
    }
  }

  return ok(c, { message: "If an account exists, a reset link has been sent." });
});

// ---------------------------------------------------------------------------
// POST /api/auth/password-reset/confirm
// ---------------------------------------------------------------------------
auth.post("/password-reset/confirm", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(PasswordResetConfirmSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const tokenHash = await hashToken(parsed.data.token);
  const record = await findPasswordResetToken(c.env.DB, tokenHash);
  if (!record || isExpired(record.expires_at)) {
    return err(c, "INVALID_TOKEN", "Invalid or expired reset link.", 400);
  }

  const newHash = await hashPassword(parsed.data.password);
  await Promise.all([
    updatePasswordHash(c.env.DB, record.user_id, newHash),
    consumePasswordResetToken(c.env.DB, record.id),
    deleteAllUserSessions(c.env.SESSION_KV, record.user_id),
  ]);

  return ok(c, { message: "Password updated. Please log in with your new password." });
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password (requires auth)
// ---------------------------------------------------------------------------
auth.post("/change-password", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(ChangePasswordSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const user = await findUserById(c.env.DB, c.get("userId"));
  if (!user) return err(c, "NOT_FOUND", "User not found.", 404);

  const valid = await verifyPassword(parsed.data.currentPassword, user.password_hash);
  if (!valid) return err(c, "INVALID_CREDENTIALS", "Current password is incorrect.", 401);

  const newHash = await hashPassword(parsed.data.newPassword);
  // Invalidate all sessions except the current one
  await Promise.all([
    updatePasswordHash(c.env.DB, user.id, newHash),
    deleteAllUserSessions(c.env.SESSION_KV, user.id),
  ]);

  return ok(c, { message: "Password changed successfully. Please log in again." });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me — return current user from access token
// ---------------------------------------------------------------------------
auth.get("/me", requireAuth, async (c) => {
  const user = await findUserById(c.env.DB, c.get("userId"));
  if (!user) return err(c, "NOT_FOUND", "User not found.", 404);
  return ok(c, {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified === 1,
  });
});

export { auth as authRouter };

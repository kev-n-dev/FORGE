/**
 * Role-Based Access Control helpers.
 * All authorization decisions must be enforced server-side.
 * Never trust client-supplied role claims beyond what the verified JWT contains.
 */

import { UserRole } from "@forge/types";

// ---------------------------------------------------------------------------
// Permission definitions
// ---------------------------------------------------------------------------

export type Permission =
  // Profile
  | "profile:read:public"
  | "profile:read:own"
  | "profile:write:own"
  | "profile:read:any"   // admin only
  | "profile:write:any"  // admin only
  // Reviews
  | "review:create"
  | "review:edit:own"     // within edit window
  | "review:respond:own"  // professional responds to their own reviews
  | "review:remove:admin" // admin only
  | "review:read:public"
  // Jobs
  | "job:create"
  | "job:read:own"
  | "job:update:own"
  // Quotes
  | "quote:create"
  | "quote:read:own"
  // Orders
  | "order:create"
  | "order:read:own"
  | "order:update:own"
  // Reports
  | "report:create"
  | "report:read:own"
  | "report:manage:admin"
  // Verification
  | "verification:submit:own"
  | "verification:manage:admin"
  // Admin
  | "admin:access"
  | "admin:users:manage"
  | "admin:reviews:manage"
  | "admin:reports:manage"
  | "admin:disputes:manage"
  | "admin:audit:read"
  | "admin:categories:manage"
  | "admin:feature_flags:manage"
  // Super admin
  | "superadmin:access";

// ---------------------------------------------------------------------------
// Role → permissions mapping
// ---------------------------------------------------------------------------

const CUSTOMER_PERMISSIONS = new Set<Permission>([
  "profile:read:public",
  "profile:read:own",
  "profile:write:own",
  "review:create",
  "review:edit:own",
  "review:read:public",
  "job:create",
  "job:read:own",
  "job:update:own",
  "order:create",
  "order:read:own",
  "report:create",
  "report:read:own",
]);

const PROFESSIONAL_PERMISSIONS = new Set<Permission>([
  ...CUSTOMER_PERMISSIONS,
  "review:respond:own",
  "quote:create",
  "quote:read:own",
  "order:update:own",
  "verification:submit:own",
]);

const ADMIN_PERMISSIONS = new Set<Permission>([
  ...PROFESSIONAL_PERMISSIONS,
  "profile:read:any",
  "profile:write:any",
  "review:remove:admin",
  "report:manage:admin",
  "verification:manage:admin",
  "admin:access",
  "admin:users:manage",
  "admin:reviews:manage",
  "admin:reports:manage",
  "admin:disputes:manage",
  "admin:audit:read",
  "admin:categories:manage",
  "admin:feature_flags:manage",
]);

const SUPERADMIN_PERMISSIONS = new Set<Permission>([
  ...ADMIN_PERMISSIONS,
  "superadmin:access",
]);

const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  [UserRole.Customer]: CUSTOMER_PERMISSIONS,
  [UserRole.Professional]: PROFESSIONAL_PERMISSIONS,
  [UserRole.Admin]: ADMIN_PERMISSIONS,
  [UserRole.SuperAdmin]: SUPERADMIN_PERMISSIONS,
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function canAll(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

export function canAny(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.Admin || role === UserRole.SuperAdmin;
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SuperAdmin;
}

export function isProfessional(role: UserRole): boolean {
  return role === UserRole.Professional || isAdmin(role);
}

export function isCustomer(role: UserRole): boolean {
  return role === UserRole.Customer || isAdmin(role);
}

// ---------------------------------------------------------------------------
// Resource ownership check helpers
// ---------------------------------------------------------------------------

/**
 * Assert that the acting user owns the resource, or is an admin.
 * Throws a typed error that the API layer can convert to a 403.
 */
export function assertOwnerOrAdmin(
  actorId: string,
  ownerId: string,
  actorRole: UserRole
): void {
  if (!isAdmin(actorRole) && actorId !== ownerId) {
    throw new AuthorizationError("You do not have permission to perform this action.");
  }
}

export class AuthorizationError extends Error {
  readonly statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  readonly statusCode = 401;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(resource = "Resource") {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  readonly statusCode = 422;
  readonly details: Record<string, string[]>;
  constructor(details: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
    this.details = details;
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error {
  readonly statusCode = 429;
  constructor(message = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
  }
}

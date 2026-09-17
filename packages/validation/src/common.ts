import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

export const zId = z.string().uuid("Invalid ID format");

export const zSlug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");

export const zEmail = z
  .string()
  .email("Invalid email address")
  .max(254, "Email address too long")
  .transform((v) => v.toLowerCase().trim());

export const zPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const zTurnstileToken = z
  .string()
  .min(1, "CAPTCHA token is required")
  .max(2048, "Invalid CAPTCHA token");

export const zUrl = z.string().url("Invalid URL").max(2048);

export const zCurrencyCode = z
  .string()
  .length(3, "Currency must be a 3-letter ISO 4217 code")
  .toUpperCase();

export const zCountryCode = z
  .string()
  .length(2, "Country must be a 2-letter ISO 3166-1 code")
  .toUpperCase();

export const zYearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Date must be in YYYY-MM format");

export const zIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const zPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Sanitise plain text — strip leading/trailing whitespace, collapse internal whitespace
export const zSafeText = (min: number, max: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .transform((v) => v.trim().replace(/\s+/g, " "));

export const zPhoneNumber = z
  .string()
  .max(20)
  .regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number");

export const zRating = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

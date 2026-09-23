import { z } from "zod";
import { ProfessionalAvailability, ReputationLevel } from "@guild/types";
import { zPaginationQuery } from "./common";

const professionalSortOptions = [
  "relevance",
  "rating",
  "reviews",
  "verified_jobs",
  "level",
  "newest",
  "recently_active",
] as const;

const productSortOptions = [
  "relevance",
  "price_asc",
  "price_desc",
  "rating",
  "newest",
] as const;

export const ProfessionalSearchSchema = zPaginationQuery.extend({
  q: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  country: z.string().length(2).toUpperCase().optional(),
  region: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  availability: z
    .string()
    .transform((v) =>
      v
        .split(",")
        .filter((a): a is ProfessionalAvailability =>
          Object.values(ProfessionalAvailability).includes(a as ProfessionalAvailability)
        )
    )
    .optional(),
  minLevel: z.coerce
    .number()
    .int()
    .min(1)
    .max(6)
    .transform((v) => v as ReputationLevel)
    .optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  minReviews: z.coerce.number().int().min(0).optional(),
  identityVerified: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  businessVerified: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  mentorship: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  sortBy: z.enum(professionalSortOptions).default("relevance"),
});

export const ProductSearchSchema = zPaginationQuery.extend({
  q: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  materials: z
    .string()
    .transform((v) => v.split(",").filter(Boolean))
    .optional(),
  madeToOrder: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  country: z.string().length(2).toUpperCase().optional(),
  sortBy: z.enum(productSortOptions).default("relevance"),
});

export type ProfessionalSearchInput = z.infer<typeof ProfessionalSearchSchema>;
export type ProductSearchInput = z.infer<typeof ProductSearchSchema>;

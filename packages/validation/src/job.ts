import { z } from "zod";
import { zCountryCode, zCurrencyCode, zId, zIsoDate, zSafeText, zTurnstileToken } from "./common";

export const CreateJobSchema = z
  .object({
    title: z.string().min(5).max(200).trim(),
    description: zSafeText(20, 5000),
    categoryId: zId,
    locationCountry: zCountryCode,
    locationRegion: z.string().max(100).optional(),
    locationCity: z.string().max(100).optional(),
    budgetMin: z.number().positive().optional(),
    budgetMax: z.number().positive().optional(),
    currency: zCurrencyCode.default("TTD"),
    desiredDate: zIsoDate.optional(),
    isPublic: z.boolean().default(true),
    turnstileToken: zTurnstileToken,
  })
  .refine(
    (data) =>
      data.budgetMin === undefined ||
      data.budgetMax === undefined ||
      data.budgetMax >= data.budgetMin,
    { message: "Maximum budget must be >= minimum budget", path: ["budgetMax"] }
  );

export const UpdateJobSchema = z.object({
  title: z.string().min(5).max(200).trim().optional(),
  description: zSafeText(20, 5000).optional(),
  desiredDate: zIsoDate.optional().nullable(),
  budgetMin: z.number().positive().optional().nullable(),
  budgetMax: z.number().positive().optional().nullable(),
});

export const QuoteLineItemSchema = z.object({
  description: z.string().min(1).max(300).trim(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

export const CreateQuoteSchema = z
  .object({
    jobId: zId,
    lineItems: z.array(QuoteLineItemSchema).min(1, "At least one line item is required").max(50),
    materialsTotal: z.number().min(0),
    laborTotal: z.number().min(0),
    additionalCosts: z.number().min(0).default(0),
    currency: zCurrencyCode,
    estimatedDurationDays: z.number().int().min(1).max(1095).optional(),
    estimatedStartDate: zIsoDate.optional(),
    estimatedEndDate: zIsoDate.optional(),
    validUntil: zIsoDate,
    notes: zSafeText(0, 2000).optional(),
    terms: zSafeText(0, 2000).optional(),
  })
  .refine(
    (data) => {
      const itemsTotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
      const declared = data.materialsTotal + data.laborTotal + data.additionalCosts;
      // Allow 1 cent rounding
      return Math.abs(itemsTotal - declared) < 1;
    },
    { message: "Quote totals do not add up" }
  );

export const ConfirmJobCompletionSchema = z.object({
  jobId: zId,
  notes: zSafeText(0, 500).optional(),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;

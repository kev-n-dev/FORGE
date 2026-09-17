import { z } from "zod";
import { zId, zSafeText, zCurrencyCode } from "./common";

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: zSafeText(10, 5000),
  price: z.number().positive("Price must be positive").max(1_000_000),
  currency: zCurrencyCode,
  categoryId: zId,
  materials: z.array(z.string().max(100)).max(20).default([]),
  dimensions: z.string().max(200).optional().nullable(),
  weight: z.string().max(100).optional().nullable(),
  isMadeToOrder: z.boolean().default(false),
  productionTimeMinDays: z.number().int().min(1).max(365).optional().nullable(),
  productionTimeMaxDays: z.number().int().min(1).max(365).optional().nullable(),
  stockQuantity: z.number().int().min(0).optional().nullable(),
  isUnlimitedStock: z.boolean().default(false),
  shippingAvailable: z.boolean().default(false),
  pickupAvailable: z.boolean().default(false),
  shippingDetails: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductVariantSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  sku: z.string().max(100).optional().nullable(),
  priceModifier: z.number().min(-1_000_000).max(1_000_000).default(0),
  stockQuantity: z.number().int().min(0).optional().nullable(),
  isAvailable: z.boolean().default(true),
});

export const CreateOrderSchema = z.object({
  productId: zId,
  variantId: zId.optional().nullable(),
  quantity: z.number().int().min(1).max(999),
  isCustomRequest: z.boolean().default(false),
  customRequestDescription: zSafeText(10, 2000).optional().nullable(),
  turnstileToken: z.string().min(1),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

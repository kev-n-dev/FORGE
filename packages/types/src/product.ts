import type { ProductStatus } from "./enums";

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g. "Small", "Walnut", "24 inch"
  sku: string | null;
  priceModifier: number; // Added to base price
  stockQuantity: number | null;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  professionalAvatarUrl: string | null;
  professionalRating: number | null;
  professionalReviewCount: number;

  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  categoryName: string;

  materials: string[];
  dimensions: string | null;
  weight: string | null;

  isMadeToOrder: boolean;
  productionTimeMinDays: number | null;
  productionTimeMaxDays: number | null;

  stockQuantity: number | null;
  isUnlimitedStock: boolean;

  shippingAvailable: boolean;
  pickupAvailable: boolean;
  shippingDetails: string | null;

  status: ProductStatus;
  images: ProductImage[];
  variants: ProductVariant[];

  averageRating: number | null;
  reviewCount: number;

  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  professionalId: string;
  professionalName: string;
  name: string;
  price: number;
  currency: string;
  primaryImageUrl: string | null;
  isMadeToOrder: boolean;
  averageRating: number | null;
  reviewCount: number;
  status: ProductStatus;
}

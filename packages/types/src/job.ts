import type { JobStatus, QuoteStatus, OrderStatus } from "./enums";

export interface Job {
  id: string;
  customerId: string;
  customerDisplayName: string;
  customerAvatarUrl: string | null;

  title: string;
  description: string;
  categoryId: string;
  categoryName: string;

  // Location — coarse only for public view
  locationCountry: string;
  locationRegion: string | null;
  locationCity: string | null;

  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;

  desiredDate: string | null;

  status: JobStatus;
  isPublic: boolean;

  mediaUrls: string[];
  quoteCount: number;
  acceptedQuoteId: string | null;

  assignedProfessionalId: string | null;
  assignedProfessionalName: string | null;

  completedAt: string | null;
  confirmedByCustomerAt: string | null;
  reviewId: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface JobSummary {
  id: string;
  customerId: string;
  title: string;
  categoryName: string;
  locationCity: string | null;
  locationCountry: string;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  status: JobStatus;
  createdAt: string;
  quoteCount: number;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  jobId: string;
  professionalId: string;
  professionalName: string;
  customerId: string;

  lineItems: QuoteLineItem[];
  materialsTotal: number;
  laborTotal: number;
  additionalCosts: number;
  totalAmount: number;
  currency: string;

  estimatedDurationDays: number | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;

  validUntil: string;
  notes: string | null;
  terms: string | null;

  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  categoryId: string;
  locationCountry: string;
  locationRegion?: string;
  locationCity?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  desiredDate?: string;
  isPublic?: boolean;
  turnstileToken: string;
}

export interface CreateQuoteRequest {
  jobId: string;
  lineItems: QuoteLineItem[];
  materialsTotal: number;
  laborTotal: number;
  additionalCosts?: number;
  currency: string;
  estimatedDurationDays?: number;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  validUntil: string;
  notes?: string;
  terms?: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  customerId: string;
  professionalId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  isCustomRequest: boolean;
  customRequestDescription: string | null;
  status: OrderStatus;
  statusHistory: OrderStatusEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusEntry {
  status: OrderStatus;
  note: string | null;
  updatedAt: string;
}

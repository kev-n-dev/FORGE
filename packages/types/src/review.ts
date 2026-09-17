import type { ReviewStatus } from "./enums";

export interface Review {
  id: string;
  professionalId: string;
  customerId: string;
  customerDisplayName: string;
  customerAvatarUrl: string | null;
  jobId: string | null;
  productId: string | null;
  orderId: string | null;

  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  wouldHireAgain: boolean | null;

  status: ReviewStatus;
  createdAt: string;
  editLockedAt: string | null;

  response: ReviewResponse | null;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  professionalId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  professionalId: string;
  averageRating: number | null;
  totalCount: number;
  wouldHireAgainPercent: number | null;
  distribution: RatingDistribution;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface CreateReviewRequest {
  jobId?: string;
  productId?: string;
  orderId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  wouldHireAgain?: boolean;
  turnstileToken: string;
}

export interface CreateReviewResponseRequest {
  body: string;
}

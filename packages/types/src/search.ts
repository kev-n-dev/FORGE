import type { ProfessionalAvailability, ReputationLevel } from "./enums";

export interface ProfessionalSearchFilters {
  query?: string;
  categoryId?: string;
  skillIds?: string[];
  country?: string;
  region?: string;
  city?: string;
  availability?: ProfessionalAvailability[];
  minLevel?: ReputationLevel;
  minRating?: number;
  minReviews?: number;
  identityVerified?: boolean;
  businessVerified?: boolean;
  availableForMentorship?: boolean;
  sortBy?: ProfessionalSortOption;
  page?: number;
  pageSize?: number;
}

export type ProfessionalSortOption =
  | "relevance"
  | "rating"
  | "reviews"
  | "verified_jobs"
  | "level"
  | "newest"
  | "recently_active";

export interface ProductSearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  materials?: string[];
  isMadeToOrder?: boolean;
  country?: string;
  sortBy?: ProductSortOption;
  page?: number;
  pageSize?: number;
}

export type ProductSortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "newest";

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Lightweight card shown in search results
export interface ProfessionalSearchCard {
  id: string;
  displayName: string;
  businessName: string | null;
  profileSlug: string;
  avatarUrl: string | null;
  categoryNames: string[];
  location: string | null;
  reputationLevel: ReputationLevel;
  reputationLevelName: string;
  averageRating: number | null;
  reviewCount: number;
  verifiedJobCount: number;
  wouldHireAgainPercent: number | null;
  identityVerified: boolean;
  businessVerified: boolean;
  availability: ProfessionalAvailability;
  isSponsored: boolean; // Clearly flagged
}

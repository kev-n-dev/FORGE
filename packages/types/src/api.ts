// ---------------------------------------------------------------------------
// Standard API response envelope
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>; // Field-level validation errors
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Signed upload URL (for R2 uploads)
// ---------------------------------------------------------------------------

export interface SignedUploadUrl {
  uploadId: string;
  uploadUrl: string;
  publicUrl: string; // Available after upload completes
  expiresAt: string;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

// ---------------------------------------------------------------------------
// Feature flags (sent to frontend on initial load)
// ---------------------------------------------------------------------------

export interface FeatureFlags {
  MARKETPLACE_ENABLED: boolean;
  JOBS_ENABLED: boolean;
  MESSAGING_ENABLED: boolean;
  RECOMMENDATIONS_ENABLED: boolean;
  MENTORSHIP_ENABLED: boolean;
  ADVERTISING_ENABLED: boolean;
  PAYMENTS_ENABLED: boolean;
  SOCIAL_FEED_ENABLED: boolean;
}

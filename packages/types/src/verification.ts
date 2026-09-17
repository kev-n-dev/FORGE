import type { VerificationStatus, VerificationType } from "./enums";

// Public badge — no sensitive document data exposed
export interface PublicVerificationBadge {
  type: VerificationType;
  label: string;
  description: string; // Clearly states what was verified, not quality
  verifiedAt: string;
  expiresAt: string | null;
}

// Admin/professional view — no document URLs in public API
export interface VerificationRecord {
  id: string;
  professionalId: string;
  type: VerificationType;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
}

// Request from professional to submit for verification
export interface SubmitVerificationRequest {
  type: VerificationType;
  // Document upload is handled via signed R2 upload URLs
  documentUploadIds: string[];
  notes?: string;
}

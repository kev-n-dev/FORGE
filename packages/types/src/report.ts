import type { DisputeStatus, ReportStatus } from "./enums";

export type ReportTargetType = "professional" | "customer" | "review" | "product" | "job" | "message";

export type ReportReason =
  // Against professionals
  | "fraud"
  | "fake_credentials"
  | "deposit_scam"
  | "misrepresentation"
  | "incomplete_work"
  | "property_damage"
  | "harassment"
  | "threats"
  | "suspicious_behavior"
  // Against customers
  | "fake_review"
  | "extortion"
  | "chargeback_abuse"
  | "fake_job"
  // General
  | "spam"
  | "inappropriate_content"
  | "other";

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  evidenceUrls: string[];
  status: ReportStatus;
  adminNotes: string | null;
  assignedAdminId: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  turnstileToken: string;
}

export interface Dispute {
  id: string;
  caseId: string;
  customerId: string;
  professionalId: string;
  jobId: string | null;
  orderId: string | null;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  adminNotes: string | null;
  assignedAdminId: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

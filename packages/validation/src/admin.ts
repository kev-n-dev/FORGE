import { z } from "zod";
import {
  AccountStatus,
  ReportStatus,
  DisputeStatus,
  VerificationStatus,
} from "@guild/types";
import { zId, zSafeText } from "./common";

export const AdminUpdateUserStatusSchema = z.object({
  userId: zId,
  status: z.nativeEnum(AccountStatus),
  reason: zSafeText(5, 500),
});

export const AdminRemoveReviewSchema = z.object({
  reviewId: zId,
  reason: zSafeText(10, 1000),
});

export const AdminUpdateReportStatusSchema = z.object({
  reportId: zId,
  status: z.nativeEnum(ReportStatus),
  adminNotes: zSafeText(0, 2000).optional(),
  resolution: zSafeText(0, 2000).optional(),
});

export const AdminUpdateDisputeStatusSchema = z.object({
  disputeId: zId,
  status: z.nativeEnum(DisputeStatus),
  adminNotes: zSafeText(0, 2000).optional(),
  resolution: zSafeText(0, 2000).optional(),
});

export const AdminReviewVerificationSchema = z.object({
  verificationId: zId,
  status: z.enum([
    VerificationStatus.Verified,
    VerificationStatus.Rejected,
  ] as [VerificationStatus.Verified, VerificationStatus.Rejected]),
  rejectionReason: zSafeText(5, 500).optional(),
  notes: zSafeText(0, 1000).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const AdminCreateCategorySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional().nullable(),
  parentId: zId.optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export type AdminUpdateUserStatusInput = z.infer<typeof AdminUpdateUserStatusSchema>;
export type AdminRemoveReviewInput = z.infer<typeof AdminRemoveReviewSchema>;
export type AdminUpdateReportStatusInput = z.infer<typeof AdminUpdateReportStatusSchema>;

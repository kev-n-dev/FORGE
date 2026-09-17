import { z } from "zod";
import { zId, zSafeText, zTurnstileToken } from "./common";

const reportTargetTypes = [
  "professional",
  "customer",
  "review",
  "product",
  "job",
  "message",
] as const;

const reportReasons = [
  "fraud",
  "fake_credentials",
  "deposit_scam",
  "misrepresentation",
  "incomplete_work",
  "property_damage",
  "harassment",
  "threats",
  "suspicious_behavior",
  "fake_review",
  "extortion",
  "chargeback_abuse",
  "fake_job",
  "spam",
  "inappropriate_content",
  "other",
] as const;

export const CreateReportSchema = z.object({
  targetType: z.enum(reportTargetTypes),
  targetId: zId,
  reason: z.enum(reportReasons),
  description: zSafeText(10, 2000),
  turnstileToken: zTurnstileToken,
});

export const CreateDisputeSchema = z.object({
  jobId: zId.optional(),
  orderId: zId.optional(),
  reason: z.string().min(5).max(200).trim(),
  description: zSafeText(20, 3000),
  turnstileToken: zTurnstileToken,
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type CreateDisputeInput = z.infer<typeof CreateDisputeSchema>;

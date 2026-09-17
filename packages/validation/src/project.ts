import { z } from "zod";
import { zId, zSafeText, zYearMonth } from "./common";

export const ProjectMediaPhase = z.enum(["before", "during", "after", "general"]);

export const CreateProjectSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  description: zSafeText(0, 3000).optional().nullable(),
  completedDate: zYearMonth.optional().nullable(),
  categoryIds: z.array(zId).min(1, "At least one category is required").max(5),
  serviceNames: z.array(z.string().max(100)).max(10).default([]),
  materials: z.array(z.string().max(100)).max(20).default([]),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const AddProjectMediaSchema = z.object({
  uploadId: zId,
  phase: ProjectMediaPhase,
  altText: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export const AddCollaboratorSchema = z.object({
  professionalId: zId,
  role: z.string().max(100).trim().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

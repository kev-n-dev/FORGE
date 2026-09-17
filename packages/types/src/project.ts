import type { ProjectStatus, ProjectVerificationStatus } from "./enums";

export interface ProjectMedia {
  id: string;
  projectId: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  phase: "before" | "during" | "after" | "general";
  sortOrder: number;
  mediaType: string;
}

export interface Project {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  title: string;
  description: string | null;
  completedDate: string | null; // YYYY-MM
  status: ProjectStatus;
  verificationStatus: ProjectVerificationStatus;
  verifiedAt: string | null;
  verifiedByCustomerId: string | null;

  // Classification
  categoryIds: string[];
  categoryNames: string[];
  serviceNames: string[];
  materials: string[];
  tags: string[];

  // Media
  media: ProjectMedia[];
  coverImageUrl: string | null;

  // Collaboration
  collaborators: ProjectCollaborator[];

  // Linked job (if verified)
  jobId: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ProjectCollaborator {
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  role: string | null; // e.g. "Electrical", "Masonry"
}

export interface ProjectSummary {
  id: string;
  professionalId: string;
  title: string;
  coverImageUrl: string | null;
  completedDate: string | null;
  verificationStatus: ProjectVerificationStatus;
  categoryNames: string[];
}

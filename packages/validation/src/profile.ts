import { z } from "zod";
import { ProfessionalAvailability } from "@forge/types";
import { zCountryCode, zId, zIsoDate, zSafeText, zUrl, zYearMonth } from "./common";

export const UpdateCustomerProfileSchema = z.object({
  firstName: z.string().min(1).max(64).trim(),
  lastName: z.string().min(1).max(64).trim(),
  displayName: z.string().min(1).max(100).trim().optional(),
  locationCountry: zCountryCode.optional(),
  locationRegion: z.string().max(100).optional(),
  locationCity: z.string().max(100).optional(),
});

export const UpdateProfessionalProfileSchema = z.object({
  displayName: z.string().min(2).max(100).trim(),
  businessName: z.string().max(150).trim().optional().nullable(),
  tagline: z.string().max(200).trim().optional().nullable(),
  bio: zSafeText(0, 2000).optional().nullable(),
  locationCountry: zCountryCode,
  locationRegion: z.string().max(100).optional().nullable(),
  locationCity: z.string().max(100).optional().nullable(),
  serviceAreaDescription: z.string().max(200).optional().nullable(),
  availability: z.nativeEnum(ProfessionalAvailability),
  availableForMentorship: z.boolean(),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  websiteUrl: zUrl.optional().nullable(),
  isPublic: z.boolean(),
});

export const SocialLinkSchema = z.object({
  platform: z.string().min(1).max(50).trim(),
  url: zUrl,
  label: z.string().max(80).optional().nullable(),
});

export const AddSkillSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  featured: z.boolean().default(false),
});

export const AddServiceSchema = z.object({
  name: z.string().min(2).max(150).trim(),
  description: zSafeText(0, 1000).optional().nullable(),
  categoryId: zId,
  startingPrice: z.number().positive().optional().nullable(),
  currency: z.string().length(3).toUpperCase().optional().nullable(),
  priceUnit: z.string().max(50).optional().nullable(),
});

export const AddServiceAreaSchema = z.object({
  country: zCountryCode,
  region: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  radiusKm: z.number().int().min(1).max(500).optional().nullable(),
  label: z.string().max(150).trim(),
});

export const AddExperienceSchema = z.object({
  title: z.string().min(1).max(150).trim(),
  organization: z.string().max(150).trim().optional().nullable(),
  description: zSafeText(0, 1000).optional().nullable(),
  startDate: zYearMonth,
  endDate: zYearMonth.optional().nullable(),
  isCurrent: z.boolean(),
});

export const AddCredentialSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  issuingOrganization: z.string().min(1).max(200).trim(),
  issueDate: zIsoDate,
  expiryDate: zIsoDate.optional().nullable(),
  credentialId: z.string().max(100).optional().nullable(),
  isPublic: z.boolean().default(true),
});

export const AddEquipmentSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  category: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const AddMaterialSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  category: z.string().max(100).optional().nullable(),
});

export type UpdateProfessionalProfileInput = z.infer<typeof UpdateProfessionalProfileSchema>;
export type AddSkillInput = z.infer<typeof AddSkillSchema>;
export type AddServiceInput = z.infer<typeof AddServiceSchema>;
export type AddCredentialInput = z.infer<typeof AddCredentialSchema>;
export type AddExperienceInput = z.infer<typeof AddExperienceSchema>;

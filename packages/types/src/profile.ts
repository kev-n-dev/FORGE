import type {
  ProfessionalAvailability,
  ReputationLevel,
  VerificationStatus,
} from "./enums";

// ---------------------------------------------------------------------------
// Shared location type — intentionally coarse for privacy
// ---------------------------------------------------------------------------
export interface PublicLocation {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  region: string | null;
  city: string | null;
  serviceAreaDescription: string | null; // e.g. "Northern Trinidad"
}

// ---------------------------------------------------------------------------
// Verification badge summary shown on public profiles
// ---------------------------------------------------------------------------
export interface VerificationBadge {
  type: string;
  label: string;
  verifiedAt: string;
  expiresAt: string | null;
  description: string; // Clearly states what was verified
}

// ---------------------------------------------------------------------------
// Trust Card — transparent evidence block shown on profiles
// ---------------------------------------------------------------------------
export interface TrustCard {
  identityVerified: boolean;
  businessVerified: boolean;
  verifiedJobsCount: number;
  averageRating: number | null;
  reviewCount: number;
  wouldHireAgainPercent: number | null;
  recommendationCount: number;
  yearsActive: number;
  portfolioProjectCount: number;
  repeatCustomerCount: number;
}

// ---------------------------------------------------------------------------
// Reputation summary
// ---------------------------------------------------------------------------
export interface ReputationSummary {
  level: ReputationLevel;
  levelName: string; // e.g. "Proven"
  levelDescription: string;
  nextLevel: ReputationLevel | null;
  nextLevelName: string | null;
  progressPercent: number; // 0-100
}

// ---------------------------------------------------------------------------
// Customer profile
// ---------------------------------------------------------------------------
export interface CustomerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  location: PublicLocation | null;
  memberSince: string;
  jobsPosted: number;
  reviewsGiven: number;
}

// ---------------------------------------------------------------------------
// Professional profile (public view)
// ---------------------------------------------------------------------------
export interface ProfessionalProfile {
  id: string;
  userId: string;
  displayName: string;
  businessName: string | null;
  tagline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;

  // Classification
  categories: ProfileCategory[];
  skills: ProfileSkill[];

  // Location
  location: PublicLocation | null;
  serviceAreas: ServiceArea[];

  // Reputation
  reputation: ReputationSummary;
  trustCard: TrustCard;
  verifications: VerificationBadge[];
  achievements: ProfileAchievement[];

  // Availability
  availability: ProfessionalAvailability;
  availableForMentorship: boolean;

  // Statistics (public)
  averageRating: number | null;
  reviewCount: number;
  verifiedJobCount: number;
  wouldHireAgainPercent: number | null;
  portfolioProjectCount: number;
  productCount: number;

  // Profile metadata
  yearsExperience: number | null;
  memberSince: string;
  lastActiveAt: string | null;
  profileSlug: string;

  // Contact / links
  websiteUrl: string | null;
  socialLinks: SocialLink[];

  // Settings
  isPublic: boolean;
  acceptingWork: boolean;
}

export interface ProfileCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface ProfileSkill {
  id: string;
  name: string;
  yearsExperience: number | null;
  featured: boolean;
}

export interface ServiceArea {
  id: string;
  country: string;
  region: string | null;
  city: string | null;
  radiusKm: number | null;
  label: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string | null;
}

export interface ProfileAchievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

// ---------------------------------------------------------------------------
// Professional profile (edit/own view) — extends public with private data
// ---------------------------------------------------------------------------
export interface ProfessionalProfileEdit extends ProfessionalProfile {
  email: string;
  phoneCountryCode: string | null;
  phoneNumber: string | null; // Never shown publicly
  privateAddress: string | null; // Never shown publicly
  verificationStatus: VerificationStatus;
}

// ---------------------------------------------------------------------------
// Service offered by a professional
// ---------------------------------------------------------------------------
export interface Service {
  id: string;
  professionalId: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  startingPrice: number | null;
  currency: string | null;
  priceUnit: string | null; // e.g. "per hour", "per job", "starting from"
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Experience entry on professional resume
// ---------------------------------------------------------------------------
export interface ExperienceEntry {
  id: string;
  professionalId: string;
  title: string;
  organization: string | null;
  description: string | null;
  startDate: string; // YYYY-MM
  endDate: string | null; // YYYY-MM or null = current
  isCurrent: boolean;
}

// ---------------------------------------------------------------------------
// Credential / certification
// ---------------------------------------------------------------------------
export interface Credential {
  id: string;
  professionalId: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  verificationStatus: VerificationStatus;
  isPublic: boolean;
}

// ---------------------------------------------------------------------------
// Tool / equipment
// ---------------------------------------------------------------------------
export interface Equipment {
  id: string;
  professionalId: string;
  name: string;
  category: string | null;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Material specialty
// ---------------------------------------------------------------------------
export interface MaterialSpecialty {
  id: string;
  professionalId: string;
  name: string;
  category: string | null;
}

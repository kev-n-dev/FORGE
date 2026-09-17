/**
 * File upload constraints.
 * Enforced on both client (UX) and server (security — never trust client alone).
 */

export const UPLOAD_LIMITS = {
  /** Profile avatar */
  avatar: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidthPx: 2000,
    maxHeightPx: 2000,
  },
  /** Profile cover image */
  cover: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidthPx: 3000,
    maxHeightPx: 1200,
  },
  /** Project / portfolio images */
  projectImage: {
    maxSizeBytes: 15 * 1024 * 1024, // 15 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidthPx: 4000,
    maxHeightPx: 4000,
  },
  /** Product images */
  productImage: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidthPx: 3000,
    maxHeightPx: 3000,
  },
  /** Verification documents — stored in private R2 bucket, never public */
  verificationDocument: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
    // Note: PDFs are stored only, not displayed inline
  },
  /** Job / report attachments */
  attachment: {
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
  },
} as const;

export type UploadCategory = keyof typeof UPLOAD_LIMITS;

/** Signed upload URL TTL in seconds */
export const UPLOAD_URL_TTL_SECONDS = 300; // 5 minutes

/** R2 key prefixes (namespace by type to simplify IAM and lifecycle rules) */
export const R2_KEY_PREFIXES = {
  avatar: "avatars/",
  cover: "covers/",
  projectImage: "projects/",
  productImage: "products/",
  verificationDocument: "verifications/private/", // Private bucket
  attachment: "attachments/",
} as const;

/** Validate a MIME type against an upload category */
export function isAllowedMimeType(
  category: UploadCategory,
  mimeType: string
): boolean {
  return (UPLOAD_LIMITS[category].allowedMimeTypes as readonly string[]).includes(mimeType);
}

/** Validate a file size against an upload category */
export function isAllowedSize(category: UploadCategory, bytes: number): boolean {
  return bytes > 0 && bytes <= UPLOAD_LIMITS[category].maxSizeBytes;
}

/** Sanitise an uploaded filename — strip path traversal and dangerous characters */
export function sanitiseFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^\./, "")
    .slice(0, 200)
    .trim();
}

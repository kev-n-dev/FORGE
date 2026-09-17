// ---------------------------------------------------------------------------
// Enumerations used across the platform
// ---------------------------------------------------------------------------

export enum UserRole {
  Customer = "customer",
  Professional = "professional",
  Admin = "admin",
  SuperAdmin = "super_admin",
}

export enum AccountStatus {
  Active = "active",
  Suspended = "suspended",
  Banned = "banned",
  PendingVerification = "pending_verification",
  Deactivated = "deactivated",
}

export enum ProfessionalAvailability {
  AcceptingWork = "accepting_work",
  LimitedAvailability = "limited_availability",
  NotAvailable = "not_available",
  AcceptingOrders = "accepting_orders",
  CustomWorkOnly = "custom_work_only",
  Mentorship = "mentorship",
}

export enum VerificationStatus {
  Unverified = "unverified",
  Pending = "pending",
  Verified = "verified",
  Rejected = "rejected",
  Expired = "expired",
}

export enum VerificationType {
  Identity = "identity",
  Business = "business",
  Credential = "credential",
  Insurance = "insurance",
}

export enum ProjectStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

export enum ProjectVerificationStatus {
  Portfolio = "portfolio",
  Verified = "verified",
  VerifiedJob = "verified_job",
}

export enum ProductStatus {
  Draft = "draft",
  Active = "active",
  OutOfStock = "out_of_stock",
  Discontinued = "discontinued",
}

export enum JobStatus {
  Draft = "draft",
  Open = "open",
  InProgress = "in_progress",
  PendingConfirmation = "pending_confirmation",
  Completed = "completed",
  Cancelled = "cancelled",
  Disputed = "disputed",
}

export enum QuoteStatus {
  Draft = "draft",
  Sent = "sent",
  Accepted = "accepted",
  Rejected = "rejected",
  Expired = "expired",
  Withdrawn = "withdrawn",
}

export enum OrderStatus {
  Pending = "pending",
  Accepted = "accepted",
  MaterialsPurchased = "materials_purchased",
  InProduction = "in_production",
  Finishing = "finishing",
  QualityCheck = "quality_check",
  Ready = "ready",
  Delivered = "delivered",
  Cancelled = "cancelled",
  Disputed = "disputed",
}

export enum ReviewStatus {
  Pending = "pending",
  Active = "active",
  Locked = "locked",
  Flagged = "flagged",
  Removed = "removed",
  UnderInvestigation = "under_investigation",
}

export enum ReportStatus {
  Reported = "reported",
  UnderInvestigation = "under_investigation",
  EvidenceRequested = "evidence_requested",
  Resolved = "resolved",
  ConfirmedViolation = "confirmed_violation",
  Dismissed = "dismissed",
}

export enum DisputeStatus {
  Open = "open",
  UnderReview = "under_review",
  WaitingForCustomer = "waiting_for_customer",
  WaitingForProfessional = "waiting_for_professional",
  Resolved = "resolved",
  Closed = "closed",
}

export enum NotificationType {
  NewMessage = "new_message",
  NewQuote = "new_quote",
  QuoteAccepted = "quote_accepted",
  QuoteRejected = "quote_rejected",
  JobUpdate = "job_update",
  JobCompleted = "job_completed",
  ReviewReceived = "review_received",
  ReviewResponse = "review_response",
  NewFollower = "new_follower",
  Recommendation = "recommendation",
  ProductOrder = "product_order",
  VerificationUpdate = "verification_update",
  ReportUpdate = "report_update",
  SystemAlert = "system_alert",
}

export enum ReputationLevel {
  New = 1,
  Established = 2,
  Trusted = 3,
  Proven = 4,
  Master = 5,
  Legacy = 6,
}

export enum ReputationEventType {
  VerifiedJobCompleted = "verified_job_completed",
  ReviewReceived = "review_received",
  FiveStarReview = "five_star_review",
  RecommendationReceived = "recommendation_received",
  RepeatCustomer = "repeat_customer",
  PortfolioProjectAdded = "portfolio_project_added",
  VerificationCompleted = "verification_completed",
  ProductSold = "product_sold",
  MentoredProfessional = "mentored_professional",
  PlatformAnniversary = "platform_anniversary",
  ReviewRemoved = "review_removed",
  ViolationConfirmed = "violation_confirmed",
}

export enum MediaType {
  Image = "image",
  Document = "document",
  Video = "video",
}

export enum PostType {
  CompletedProject = "completed_project",
  WorkInProgress = "work_in_progress",
  NewProduct = "new_product",
  Tip = "tip",
  Certification = "certification",
  Announcement = "announcement",
  Promotion = "promotion",
  Workshop = "workshop",
}

export enum ConnectionStatus {
  Pending = "pending",
  Connected = "connected",
  Rejected = "rejected",
  Blocked = "blocked",
}

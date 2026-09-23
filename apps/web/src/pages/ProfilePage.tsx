import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { TrustCard } from "@/components/profile/TrustCard";
import { ContactModal } from "@/components/profile/ContactModal";
import { ReportModal } from "@/components/profile/ReportModal";
import { WriteReviewModal } from "@/components/reviews/WriteReviewModal";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { ProfessionalProfile, Review, PaginatedResponse } from "@forge/types";
import { LEVEL_NAMES, LEVEL_DISCLAIMER } from "@forge/config";
import type { ReputationLevel } from "@forge/types";
import {
  MapPin, Calendar, ExternalLink, Briefcase, Star, TrendingUp,
  Info, Package, Wrench, MessageSquare, FileText, Image, Flag, PenLine,
} from "lucide-react";

interface TrustCardData {
  identityVerified: boolean;
  businessVerified: boolean;
  verifiedJobsCount: number;
  averageRating: number | null;
  reviewCount: number;
  wouldHireAgainPercent: number | null;
  recommendationCount: number;
  yearsActive: number;
  portfolioProjectCount: number;
}

interface ProjectMedia {
  id: string;
  url: string;
  phase: string;
  alt_text: string | null;
  sort_order: number;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  completed_date: string | null;
  verification_status: string;
  cover_image_url: string | null;
  media: ProjectMedia[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category_name: string | null;
  starting_price: number | null;
  currency: string | null;
  price_unit: string | null;
}

export function ProfilePage() {
  const { slug } = useParams({ from: "/people/$slug" });
  const [contactMode, setContactMode] = useState<"contact" | "quote" | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", slug],
    queryFn: () => api.get<ProfessionalProfile>(`/profiles/${slug}`),
  });

  const { data: trustCard } = useQuery({
    queryKey: ["trust-card", slug],
    queryFn: () => api.get<TrustCardData>(`/profiles/${slug}/trust-card`),
    enabled: !!profile,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", slug],
    queryFn: () => api.get<PaginatedResponse<Review>>(`/reviews/professional/${slug}?pageSize=5`),
    enabled: !!profile,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", slug],
    queryFn: () => api.get<{ items: Project[]; total: number }>(`/profiles/${slug}/projects?pageSize=6`),
    enabled: !!profile,
  });

  const { data: services } = useQuery({
    queryKey: ["services", slug],
    queryFn: () => api.get<Service[]>(`/profiles/${slug}/services`),
    enabled: !!profile,
  });

  if (profileLoading) {
    return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="text-charcoal-400">This profile doesn't exist or is private.</p>
        <Link to="/discover" className="forge-btn-primary inline-flex">Browse professionals</Link>
      </div>
    );
  }

  return (
    <>
      {/* Contact Modal */}
      {contactMode && (
        <ContactModal
          professionalName={profile.businessName ?? profile.displayName}
          professionalSlug={profile.profileSlug}
          professionalUserId={profile.userId}
          mode={contactMode}
          onClose={() => setContactMode(null)}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="professional"
        targetId={profile.id}
        targetName={profile.businessName ?? profile.displayName}
      />

      {/* Write Review Modal */}
      <WriteReviewModal
        open={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        professionalId={profile.id}
        professionalName={profile.businessName ?? profile.displayName}
        professionalSlug={profile.profileSlug}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover */}
        {profile.coverUrl && (
          <div className="h-48 md:h-64 rounded-2xl overflow-hidden mb-6">
            <img src={profile.coverUrl} alt="" className="w-full h-full object-cover" aria-hidden="true" />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-8">

            {/* Header card */}
            <div className="forge-card p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-charcoal-50">
                    {profile.businessName ?? profile.displayName}
                  </h1>
                  {profile.businessName && (
                    <p className="text-charcoal-400">{profile.displayName}</p>
                  )}
                  {profile.tagline && (
                    <p className="text-charcoal-300 mt-1">{profile.tagline}</p>
                  )}

                  {/* Categories */}
                  {profile.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {profile.categories.map((c) => (
                        <span key={c.id} className="text-xs font-medium text-charcoal-300 bg-charcoal-800 px-2.5 py-1 rounded">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  {profile.averageRating !== null && (
                    <div className="flex items-center gap-3 mt-3">
                      <StarRating rating={profile.averageRating} />
                      <span className="text-charcoal-400 text-sm">
                        {profile.reviewCount} review{profile.reviewCount !== 1 ? "s" : ""}
                      </span>
                      {profile.wouldHireAgainPercent !== null && (
                        <span className="text-green-400 text-sm font-medium">
                          {profile.wouldHireAgainPercent}% would hire again
                        </span>
                      )}
                    </div>
                  )}

                  {/* Level */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="level">
                      Level {profile.reputation.level} — {LEVEL_NAMES[profile.reputation.level as ReputationLevel]}
                    </Badge>
                    <span className="text-xs text-charcoal-500 flex items-center gap-1" title={LEVEL_DISCLAIMER}>
                      <Info className="h-3 w-3" aria-hidden="true" />
                      Platform milestone
                    </span>
                  </div>

                  {/* Verifications */}
                  {profile.verifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.verifications.map((v) => (
                        <Badge key={v.type} variant="verified">{v.label}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-charcoal-400">
                    {profile.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {[profile.location.city, profile.location.region, profile.location.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      Member since {new Date(profile.memberSince).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                    </span>
                    {profile.verifiedJobCount > 0 && (
                      <span className="flex items-center gap-1.5 text-green-400">
                        <Briefcase className="h-4 w-4" aria-hidden="true" />
                        {profile.verifiedJobCount} verified jobs
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button onClick={() => setContactMode("contact")}>
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  Contact
                </Button>
                <Button variant="secondary" onClick={() => setContactMode("quote")}>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Request Quote
                </Button>
                <Button variant="secondary" onClick={() => setShowWriteReview(true)}>
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                  Write a Review
                </Button>
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="forge-btn-ghost text-sm"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Website
                  </a>
                )}
                <button
                  onClick={() => setShowReport(true)}
                  className="forge-btn-ghost text-sm text-charcoal-500 hover:text-red-400 ml-auto"
                >
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  Report
                </button>
              </div>
            </div>

            {/* About */}
            {profile.bio && (
              <section className="forge-card p-6" aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-lg font-semibold text-charcoal-100 mb-3">About</h2>
                <p className="text-charcoal-300 leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </section>
            )}

            {/* Services */}
            {services && services.length > 0 && (
              <section className="forge-card p-6" aria-labelledby="services-heading">
                <h2 id="services-heading" className="text-lg font-semibold text-charcoal-100 mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-copper-500" aria-hidden="true" />
                  Services
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {services.map((s) => (
                    <div key={s.id} className="bg-charcoal-800 rounded-lg p-4 space-y-1">
                      <p className="font-medium text-charcoal-100">{s.name}</p>
                      {s.description && (
                        <p className="text-sm text-charcoal-400 leading-relaxed">{s.description}</p>
                      )}
                      {s.starting_price !== null && (
                        <p className="text-sm text-copper-400 font-medium">
                          From {s.currency ?? ""} {s.starting_price.toLocaleString()}
                          {s.price_unit && <span className="text-charcoal-500"> {s.price_unit}</span>}
                        </p>
                      )}
                      {s.category_name && (
                        <span className="text-xs text-charcoal-500">{s.category_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <section className="forge-card p-6" aria-labelledby="skills-heading">
                <h2 id="skills-heading" className="text-lg font-semibold text-charcoal-100 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span key={s.id} className="px-3 py-1.5 bg-charcoal-800 border border-charcoal-700 rounded-lg text-sm text-charcoal-200">
                      {s.name}
                      {s.yearsExperience && <span className="text-charcoal-500 ml-1.5">· {s.yearsExperience}yr</span>}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio */}
            {projectsData && projectsData.items.length > 0 && (
              <section aria-labelledby="portfolio-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="portfolio-heading" className="text-lg font-semibold text-charcoal-100 flex items-center gap-2">
                    <Package className="h-5 w-5 text-copper-500" aria-hidden="true" />
                    Portfolio
                    <span className="text-charcoal-500 text-sm font-normal">({projectsData.total})</span>
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {projectsData.items.map((project) => {
                    const coverMedia = project.media.find((m) => m.phase === "after") ?? project.media[0];
                    return (
                      <div key={project.id} className="forge-card overflow-hidden group">
                        {/* Image */}
                        <div className="aspect-video bg-charcoal-800 overflow-hidden relative">
                          {coverMedia ? (
                            <img
                              src={coverMedia.url}
                              alt={coverMedia.alt_text ?? project.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-10 w-10 text-charcoal-700" aria-hidden="true" />
                            </div>
                          )}
                          {/* Verified badge */}
                          {project.verification_status !== "portfolio" && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="verified" icon={false}>
                                {project.verification_status === "verified_job" ? "✓ Verified Job" : "✓ Verified"}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-4 space-y-1">
                          <p className="font-medium text-charcoal-100">{project.title}</p>
                          {project.completed_date && (
                            <p className="text-xs text-charcoal-500">
                              Completed {project.completed_date}
                            </p>
                          )}
                          {project.description && (
                            <p className="text-sm text-charcoal-400 line-clamp-2 leading-relaxed">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reviews */}
            {reviewsData && reviewsData.items.length > 0 ? (
              <section aria-labelledby="reviews-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="reviews-heading" className="text-lg font-semibold text-charcoal-100 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400" aria-hidden="true" />
                    Reviews
                    <span className="text-charcoal-500 text-sm font-normal">({reviewsData.pagination.total})</span>
                  </h2>
                  <Button variant="secondary" size="sm" onClick={() => setShowWriteReview(true)}>
                    <PenLine className="h-4 w-4" aria-hidden="true" />
                    Write a review
                  </Button>
                </div>
                <div className="space-y-4">
                  {reviewsData.items.map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      onReport={() => setShowReport(true)}
                    />
                  ))}
                </div>
                {reviewsData.pagination.hasNextPage && (
                  <div className="mt-4 text-center">
                    <Button variant="secondary">Load more reviews</Button>
                  </div>
                )}
              </section>
            ) : reviewsData && reviewsData.items.length === 0 ? (
              <section className="forge-card p-6 text-center" aria-labelledby="reviews-empty">
                <Star className="h-8 w-8 text-charcoal-700 mx-auto mb-2" aria-hidden="true" />
                <h2 id="reviews-empty" className="font-medium text-charcoal-400">No reviews yet</h2>
                <p className="text-sm text-charcoal-500 mt-1">Be the first to work with {profile.displayName} and leave a review.</p>
              </section>
            ) : null}
          </div>

          {/* Right col */}
          <div className="space-y-6">
            {/* Trust card */}
            {trustCard && <TrustCard data={trustCard} />}

            {/* Quick stats */}
            <div className="forge-card p-5 space-y-4">
              <h2 className="text-base font-semibold text-charcoal-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-copper-500" aria-hidden="true" />
                At a glance
              </h2>
              <dl className="space-y-3 text-sm">
                {profile.portfolioProjectCount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal-400">Portfolio projects</dt>
                    <dd className="font-medium text-charcoal-100">{profile.portfolioProjectCount}</dd>
                  </div>
                )}
                {profile.verifiedJobCount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal-400">Verified jobs</dt>
                    <dd className="font-medium text-green-400">{profile.verifiedJobCount}</dd>
                  </div>
                )}
                {profile.yearsExperience !== null && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal-400">Years experience</dt>
                    <dd className="font-medium text-charcoal-100">{profile.yearsExperience}</dd>
                  </div>
                )}
                {profile.availability && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal-400">Availability</dt>
                    <dd className="font-medium text-charcoal-100 capitalize">
                      {profile.availability.replace(/_/g, " ")}
                    </dd>
                  </div>
                )}
                {profile.location?.serviceAreaDescription && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal-400">Service area</dt>
                    <dd className="font-medium text-charcoal-100 text-right">{profile.location.serviceAreaDescription}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* CTA sidebar */}
            <div className="forge-card p-5 space-y-3">
              <Button className="w-full" onClick={() => setContactMode("contact")}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Contact {profile.displayName.split(" ")[0]}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setContactMode("quote")}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                Request a Quote
              </Button>
            </div>

            {/* Level disclaimer */}
            <div className="flex gap-2 bg-charcoal-900 border border-charcoal-800 rounded-xl p-4">
              <Info className="h-4 w-4 text-charcoal-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-charcoal-500 leading-relaxed">{LEVEL_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

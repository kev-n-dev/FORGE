import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { TrustCard } from "@/components/profile/TrustCard";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type {
  ProfessionalProfile,
  Review,
  PaginatedResponse,
} from "@forge/types";
import { LEVEL_NAMES, LEVEL_DISCLAIMER } from "@forge/config";
import type { ReputationLevel } from "@forge/types";
import { MapPin, Calendar, ExternalLink, Briefcase, Star, TrendingUp, Info } from "lucide-react";

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

export function ProfilePage() {
  const { slug } = useParams({ from: "/people/$slug" });

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

  if (profileLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
        <p className="text-charcoal-400">This professional profile doesn&apos;t exist or is private.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cover image */}
      {profile.coverUrl && (
        <div className="h-48 md:h-64 rounded-2xl overflow-hidden mb-0 -mt-0">
          <img
            src={profile.coverUrl}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 mt-6">
        {/* Left: profile details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="forge-card p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <Avatar
                src={profile.avatarUrl}
                name={profile.displayName}
                size="xl"
              />
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
                      <span
                        key={c.id}
                        className="text-xs font-medium text-charcoal-300 bg-charcoal-800 px-2.5 py-1 rounded"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ratings */}
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

                {/* Level badge */}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="level">
                    Level {profile.reputation.level} — {LEVEL_NAMES[profile.reputation.level as ReputationLevel]}
                  </Badge>
                  <span
                    className="text-xs text-charcoal-500 flex items-center gap-1 cursor-help"
                    title={LEVEL_DISCLAIMER}
                  >
                    <Info className="h-3 w-3" aria-hidden="true" />
                    Platform milestone
                  </span>
                </div>

                {/* Verification badges */}
                {profile.verifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.verifications.map((v) => (
                      <Badge key={v.type} variant="verified">
                        {v.label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-charcoal-400">
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {[profile.location.city, profile.location.region, profile.location.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Member since{" "}
                    {new Date(profile.memberSince).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
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

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button>Contact</Button>
              <Button variant="secondary">Request Quote</Button>
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
            </div>
          </div>

          {/* About */}
          {profile.bio && (
            <section className="forge-card p-6" aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-lg font-semibold text-charcoal-100 mb-3">
                About
              </h2>
              <p className="text-charcoal-300 leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </section>
          )}

          {/* Skills */}
          {profile.skills.length > 0 && (
            <section className="forge-card p-6" aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="text-lg font-semibold text-charcoal-100 mb-4">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1.5 bg-charcoal-800 border border-charcoal-700 rounded-lg text-sm text-charcoal-200"
                  >
                    {s.name}
                    {s.yearsExperience && (
                      <span className="text-charcoal-500 ml-1.5">
                        · {s.yearsExperience}yr
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {reviewsData && reviewsData.items.length > 0 && (
            <section aria-labelledby="reviews-heading">
              <div className="flex items-center gap-3 mb-4">
                <h2 id="reviews-heading" className="text-lg font-semibold text-charcoal-100 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  Reviews
                </h2>
                <span className="text-charcoal-500 text-sm">
                  ({reviewsData.pagination.total} total)
                </span>
              </div>
              <div className="space-y-4">
                {reviewsData.items.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
              {reviewsData.pagination.hasNextPage && (
                <div className="mt-4 text-center">
                  <Button variant="secondary">Load more reviews</Button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right: trust card + stats */}
        <div className="space-y-6">
          {trustCard && <TrustCard data={trustCard} />}

          {/* Quick stats */}
          {profile.portfolioProjectCount > 0 && (
            <div className="forge-card p-5 space-y-4">
              <h2 className="text-base font-semibold text-charcoal-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-copper-500" aria-hidden="true" />
                At a glance
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-charcoal-400">Portfolio projects</dt>
                  <dd className="font-medium text-charcoal-100">{profile.portfolioProjectCount}</dd>
                </div>
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
              </dl>
            </div>
          )}

          {/* Level disclaimer — always shown */}
          <div className="flex gap-2 bg-charcoal-900 border border-charcoal-800 rounded-xl p-4">
            <Info className="h-4 w-4 text-charcoal-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-charcoal-500 leading-relaxed">{LEVEL_DISCLAIMER}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

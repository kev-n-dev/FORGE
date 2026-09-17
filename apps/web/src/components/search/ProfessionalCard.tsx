import { Link } from "@tanstack/react-router";
import type { ProfessionalSearchCard } from "@forge/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { MapPin, Briefcase, TrendingUp } from "lucide-react";
import { LEVEL_NAMES } from "@forge/config";
import type { ReputationLevel } from "@forge/types";
import { cn } from "@/lib/cn";

interface ProfessionalCardProps {
  professional: ProfessionalSearchCard;
  className?: string;
}

export function ProfessionalCard({ professional: p, className }: ProfessionalCardProps) {
  return (
    <article
      className={cn(
        "forge-card p-5 flex flex-col gap-4 hover:shadow-card-hover hover:border-charcoal-700 transition-all duration-150",
        className
      )}
    >
      {/* Sponsored flag — clearly visible, never hidden */}
      {p.isSponsored && (
        <div className="flex justify-end -mb-2">
          <Badge variant="sponsored">Sponsored</Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/people/$slug" params={{ slug: p.profileSlug }} aria-hidden="true" tabIndex={-1}>
          <Avatar src={p.avatarUrl} name={p.displayName} size="lg" />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to="/people/$slug"
            params={{ slug: p.profileSlug }}
            className="text-lg font-semibold text-charcoal-50 hover:text-copper-400 transition-colors block truncate"
          >
            {p.businessName ?? p.displayName}
          </Link>

          {p.businessName && (
            <p className="text-sm text-charcoal-400 truncate">{p.displayName}</p>
          )}

          <div className="flex flex-wrap gap-1 mt-1">
            {p.categoryNames.slice(0, 3).map((cat) => (
              <span key={cat} className="text-xs text-charcoal-400 bg-charcoal-800 px-2 py-0.5 rounded">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reputation evidence — the core of FORGE's transparency */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Rating */}
        {p.averageRating !== null ? (
          <div className="flex items-center gap-2">
            <StarRating rating={p.averageRating} size="sm" />
            <span className="text-charcoal-400 text-xs">({p.reviewCount})</span>
          </div>
        ) : (
          <span className="text-charcoal-500 text-xs">No reviews yet</span>
        )}

        {/* Level */}
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-copper-500" aria-hidden="true" />
          <Badge variant="level" icon={false}>
            Level {p.reputationLevel} — {LEVEL_NAMES[p.reputationLevel as ReputationLevel]}
          </Badge>
        </div>

        {/* Verified jobs */}
        {p.verifiedJobCount > 0 && (
          <div className="text-charcoal-300">
            <span className="font-semibold">{p.verifiedJobCount}</span>
            <span className="text-charcoal-400 ml-1">verified jobs</span>
          </div>
        )}

        {/* Would hire again */}
        {p.wouldHireAgainPercent !== null && (
          <div className="text-charcoal-300">
            <span className="font-semibold text-green-400">{p.wouldHireAgainPercent}%</span>
            <span className="text-charcoal-400 ml-1">would hire again</span>
          </div>
        )}
      </div>

      {/* Verification badges */}
      {(p.identityVerified || p.businessVerified) && (
        <div className="flex flex-wrap gap-2">
          {p.identityVerified && (
            <Badge variant="verified">Identity Verified</Badge>
          )}
          {p.businessVerified && (
            <Badge variant="verified">Business Verified</Badge>
          )}
        </div>
      )}

      {/* Location + availability */}
      <div className="flex items-center justify-between text-xs text-charcoal-400">
        {p.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {p.location}
          </span>
        )}
        <span
          className={cn(
            "flex items-center gap-1",
            p.availability === "accepting_work" ? "text-green-400" : "text-charcoal-500"
          )}
        >
          <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
          {p.availability === "accepting_work" ? "Accepting Work" :
           p.availability === "limited_availability" ? "Limited Availability" :
           "Not Available"}
        </span>
      </div>

      {/* CTA */}
      <Link
        to="/people/$slug"
        params={{ slug: p.profileSlug }}
        className="forge-btn-secondary text-sm text-center w-full"
      >
        View Profile
      </Link>
    </article>
  );
}

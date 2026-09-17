import { CheckCircle2, Info } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { TRUST_CARD_DISCLAIMER } from "@forge/config";

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
  repeatCustomerCount?: number;
}

export function TrustCard({ data }: { data: TrustCardData }) {
  const evidenceItems = [
    data.identityVerified && { label: "Identity Verified", positive: true },
    data.businessVerified && { label: "Business Verified", positive: true },
    data.verifiedJobsCount > 0 && {
      label: `${data.verifiedJobsCount} verified jobs`,
      positive: true,
    },
    data.averageRating !== null && {
      label: `${data.averageRating.toFixed(1)} average rating (${data.reviewCount} reviews)`,
      positive: true,
    },
    data.wouldHireAgainPercent !== null && {
      label: `${data.wouldHireAgainPercent}% would hire again`,
      positive: true,
    },
    data.recommendationCount > 0 && {
      label: `${data.recommendationCount} customer recommendations`,
      positive: true,
    },
    data.yearsActive > 0 && {
      label: `Active for ${data.yearsActive} year${data.yearsActive !== 1 ? "s" : ""}`,
      positive: true,
    },
    data.portfolioProjectCount > 0 && {
      label: `${data.portfolioProjectCount} portfolio projects`,
      positive: true,
    },
  ].filter(Boolean) as Array<{ label: string; positive: boolean }>;

  return (
    <section
      className="forge-card p-5 space-y-4"
      aria-labelledby="trust-card-heading"
    >
      <h2
        id="trust-card-heading"
        className="text-base font-semibold text-charcoal-100 flex items-center gap-2"
      >
        <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
        Why consider this profile?
      </h2>

      {evidenceItems.length > 0 ? (
        <ul className="space-y-2" aria-label="Trust evidence">
          {evidenceItems.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm text-charcoal-200">
              <CheckCircle2
                className="h-4 w-4 text-green-400 shrink-0"
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-charcoal-400">
          This professional is new to FORGE. No evidence available yet.
        </p>
      )}

      {/* Mandatory disclaimer — never implied as a quality guarantee */}
      <div className="flex gap-2 bg-charcoal-800 rounded-lg p-3">
        <Info className="h-4 w-4 text-charcoal-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-charcoal-400 leading-relaxed">
          {TRUST_CARD_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}

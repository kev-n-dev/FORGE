import { StarRating } from "@/components/ui/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { ThumbsUp, MessageSquare, Flag } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Review } from "@guild/types";

interface ReviewCardProps {
  review: Review;
  canRespond?: boolean;
  onRespond?: () => void;
  onReport?: () => void;
}

export function ReviewCard({ review: r, canRespond, onRespond, onReport }: ReviewCardProps) {
  const isLocked = r.editLockedAt ? new Date(r.editLockedAt) < new Date() : false;

  return (
    <article
      className="guild-card p-5 space-y-4"
      aria-labelledby={`review-${r.id}-heading`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={r.customerAvatarUrl}
            name={r.customerDisplayName}
            size="sm"
          />
          <div>
            <p className="font-medium text-charcoal-100 text-sm">{r.customerDisplayName}</p>
            <p className="text-xs text-charcoal-500">
              {new Date(r.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {isLocked && (
                <span className="ml-2 text-charcoal-600">(Locked)</span>
              )}
            </p>
          </div>
        </div>

        <StarRating rating={r.rating} showValue={false} size="sm" />
      </div>

      {/* Body */}
      <p
        id={`review-${r.id}-heading`}
        className="text-sm text-charcoal-200 leading-relaxed"
      >
        {r.body}
      </p>

      {/* Would hire again */}
      {r.wouldHireAgain !== null && (
        <div
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            r.wouldHireAgain ? "text-green-400" : "text-charcoal-400"
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          {r.wouldHireAgain ? "Would hire again" : "Would not hire again"}
        </div>
      )}

      {/* Professional response */}
      {r.response && (
        <div className="bg-charcoal-800 rounded-lg p-4 border-l-2 border-copper-700 space-y-1">
          <p className="text-xs font-semibold text-copper-400 uppercase tracking-wider">
            Response from professional
          </p>
          <p className="text-sm text-charcoal-200 leading-relaxed">{r.response.body}</p>
          <p className="text-xs text-charcoal-500">
            {new Date(r.response.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        {canRespond && !r.response && (
          <button
            onClick={onRespond}
            className="flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-charcoal-200 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Respond
          </button>
        )}
        <button
          onClick={onReport}
          className="flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-red-400 transition-colors ml-auto"
          aria-label="Report this review"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          Report
        </button>
      </div>
    </article>
  );
}

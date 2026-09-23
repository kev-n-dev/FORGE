import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api, ApiClientError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Star, CheckCircle2, AlertCircle, ThumbsUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

interface WriteReviewModalProps {
  open: boolean;
  onClose: () => void;
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
}

export function WriteReviewModal({
  open, onClose, professionalId, professionalName, professionalSlug,
}: WriteReviewModalProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [wouldHireAgain, setWouldHireAgain] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0 || body.length < 10) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/reviews?professionalId=${professionalId}`, {
        rating,
        body,
        wouldHireAgain,
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      });
      setSubmitted(true);
      // Invalidate reviews cache
      void queryClient.invalidateQueries({ queryKey: ["reviews", professionalSlug] });
      void queryClient.invalidateQueries({ queryKey: ["trust-card", professionalSlug] });
      void queryClient.invalidateQueries({ queryKey: ["profile", professionalSlug] });
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitted) {
      setRating(0);
      setBody("");
      setWouldHireAgain(null);
      setError("");
    }
    setSubmitted(false);
    onClose();
  };

  const starLabels = ["Terrible", "Poor", "Okay", "Good", "Excellent"];
  const displayRating = hovered || rating;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Review ${professionalName}`}
      description="Your honest review helps other customers make informed decisions."
    >
      {!isAuthenticated ? (
        <div className="space-y-4">
          <p className="text-sm text-charcoal-400">You need to be signed in to leave a review.</p>
          <Link to="/login" className="forge-btn-primary inline-flex" onClick={handleClose}>Sign in</Link>
        </div>
      ) : submitted ? (
        <div className="text-center space-y-3 py-4">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
          <p className="font-medium text-charcoal-100">Review submitted!</p>
          <p className="text-sm text-charcoal-400">
            Thank you. Your review will be visible after a short processing window.
          </p>
          <Button onClick={handleClose} variant="secondary">Close</Button>
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Star rating */}
          <div>
            <p className="forge-label">Rating <span className="text-red-400">*</span></p>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  aria-label={`${star} star${star !== 1 ? "s" : ""} — ${starLabels[star - 1]}`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= displayRating ? "fill-amber-400 text-amber-400" : "fill-none text-charcoal-600"
                    )}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-2 text-sm text-charcoal-400">{starLabels[displayRating - 1]}</span>
              )}
            </div>
          </div>

          {/* Review body */}
          <div>
            <label htmlFor="review-body" className="forge-label">
              Your review <span className="text-red-400">*</span>
              <span className="text-charcoal-500 font-normal ml-1">(min 10 characters)</span>
            </label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={`Describe your experience with ${professionalName}…`}
              className="forge-input resize-none mt-1.5"
              maxLength={2000}
            />
            <p className="text-xs text-charcoal-500 mt-1">{body.length}/2000</p>
          </div>

          {/* Would hire again */}
          <div>
            <p className="forge-label">Would you hire again?</p>
            <div className="flex gap-3 mt-2">
              {[
                { value: true, label: "Yes", color: "text-green-400 border-green-700 bg-green-900/20" },
                { value: false, label: "No", color: "text-red-400 border-red-700 bg-red-900/20" },
              ].map(({ value, label, color }) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setWouldHireAgain(wouldHireAgain === value ? null : value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                    wouldHireAgain === value
                      ? color
                      : "border-charcoal-700 bg-charcoal-800 text-charcoal-400 hover:border-charcoal-600"
                  )}
                  aria-pressed={wouldHireAgain === value}
                >
                  <ThumbsUp className={cn("h-4 w-4", value === false && "rotate-180")} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-charcoal-500 leading-relaxed">
            Reviews are public and cannot be deleted by the professional. You have 48 hours to
            edit after submitting.
          </p>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={() => void handleSubmit()}
              loading={submitting}
              disabled={rating === 0 || body.length < 10}
            >
              Submit review
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

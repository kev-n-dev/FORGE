import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };

export function StarRating({
  rating,
  max = 5,
  size = "md",
  showValue = true,
  className,
}: StarRatingProps) {
  const rounded = Math.round(rating * 2) / 2; // Round to nearest 0.5
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Rating: ${rating} out of ${max}`}
      role="img"
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizes[size],
              i < Math.floor(rounded) ? "fill-amber-400 text-amber-400" :
              i < rounded ? "fill-amber-400/50 text-amber-400" :
              "fill-none text-charcoal-600"
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className={cn("font-semibold text-charcoal-100", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}

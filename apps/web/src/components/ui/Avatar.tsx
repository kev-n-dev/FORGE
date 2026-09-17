import { cn } from "@/lib/cn";

interface AvatarProps {
  src: string | null | undefined;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "h-7 w-7 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-2xl",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function colorFromName(name: string): string {
  // Deterministic color based on name
  const colors = [
    "bg-copper-700", "bg-blue-700", "bg-emerald-700",
    "bg-violet-700", "bg-rose-700", "bg-amber-700",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx] ?? "bg-charcoal-700";
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name}'s profile picture`}
        className={cn("rounded-full object-cover ring-2 ring-charcoal-700 shrink-0", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full ring-2 ring-charcoal-700 shrink-0 flex items-center justify-center font-semibold text-white",
        colorFromName(name),
        sizes[size],
        className
      )}
      aria-label={`${name}'s avatar`}
      role="img"
    >
      {initials(name)}
    </div>
  );
}

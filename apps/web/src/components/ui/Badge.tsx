import { cn } from "@/lib/cn";
import { ShieldCheck, CheckCircle2, Megaphone } from "lucide-react";

type BadgeVariant = "verified" | "level" | "sponsored" | "availability" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  verified: "guild-badge-verified",
  level: "guild-badge-level",
  sponsored: "guild-badge-sponsored",
  availability: "guild-badge bg-blue-900/50 text-blue-300 border border-blue-800",
  default: "guild-badge bg-charcoal-800 text-charcoal-300 border border-charcoal-700",
};

const variantIcons: Partial<Record<BadgeVariant, React.ReactNode>> = {
  verified: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
  sponsored: <Megaphone className="h-3 w-3" aria-hidden="true" />,
  level: <ShieldCheck className="h-3 w-3" aria-hidden="true" />,
};

export function Badge({ variant = "default", children, className, icon = true }: BadgeProps) {
  return (
    <span className={cn(variantStyles[variant], className)}>
      {icon && variantIcons[variant]}
      {children}
    </span>
  );
}

import { BadgeCheck } from "lucide-react";
import { cn } from "@/utils/cn";

export function VerifiedBadge({
  className,
  label = "Verified",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest",
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

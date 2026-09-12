import type { ContributionStatus } from "@/types";
import { cn } from "@/utils/cn";

const styles: Record<ContributionStatus, string> = {
  paid: "bg-forest/10 text-forest",
  pending: "bg-earth/10 text-earth",
  failed: "bg-danger/10 text-danger",
  refunded: "bg-cream-dark text-ink-muted",
};

const labels: Record<ContributionStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

export function ContributionStatusBadge({ status }: { status: ContributionStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

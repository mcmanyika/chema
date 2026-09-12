import { Check, LoaderCircle } from "lucide-react";
import type { Contribution } from "@/types";
import { formatMoney } from "@/utils/format";
import { ContributionStatusBadge } from "@/components/dashboard/ContributionStatusBadge";

export function ContributionCard({ contribution }: { contribution: Contribution }) {
  const title = contribution.campaignTitle ?? contribution.deceasedName ?? "Chema";
  const isPaid = contribution.status === "paid";
  const isPending = contribution.status === "pending";

  return (
    <article className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-cream-dark text-forest">
          {isPaid ? <Check className="h-4 w-4" /> : null}
          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {!isPaid && !isPending ? <span className="text-xs">•</span> : null}
        </div>
        <div>
          <p className="font-medium text-ink">{title}</p>
          <p className="mt-1 font-serif text-xl text-ink">
            {formatMoney(contribution.amount, contribution.currency)}
          </p>
          {isPending ? (
            <p className="mt-1 text-sm text-earth">Processing</p>
          ) : null}
        </div>
      </div>
      <ContributionStatusBadge status={contribution.status} />
    </article>
  );
}

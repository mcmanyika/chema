"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Campaign } from "@/types";
import { formatMoney, formatPeopleHaveGiven, initials, truncate } from "@/utils/format";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Button } from "@/components/ui/Button";

export function CampaignCard({
  campaign,
  onGive,
}: {
  campaign: Campaign;
  onGive?: (campaign: Campaign) => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <Link href={`/campaigns/${campaign.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
          {campaign.deceasedPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.deceasedPhotoUrl}
              alt={campaign.deceasedName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-4xl text-forest/40">
              {initials(campaign.deceasedName)}
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-serif text-xl leading-snug text-ink">
            <Link href={`/campaigns/${campaign.slug}`} className="hover:underline">
              {campaign.title}
            </Link>
          </h3>
          {campaign.verificationStatus === "verified" ? <VerifiedBadge /> : null}
        </div>
        <p className="text-sm font-medium text-forest">{campaign.deceasedName}</p>
        <p className="mt-2 flex-1 text-sm leading-6 text-ink-muted">
          {truncate(campaign.description, 130)}
        </p>
        <div className="mt-4 border-t border-line pt-4">
          <p className="font-serif text-2xl text-ink">{formatMoney(campaign.amountRaised, campaign.currency)}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {campaign.goalAmount
              ? `raised of ${formatMoney(campaign.goalAmount, campaign.currency)} hoped for`
              : "raised with the family"}
          </p>
          <p className="mt-2 text-sm text-ink">{formatPeopleHaveGiven(campaign.contributorCount)}</p>
        </div>
        <div className="mt-4">
          <Button
            className="w-full"
            onClick={() => onGive?.(campaign)}
            type="button"
          >
            <Heart className="h-4 w-4" />
            Give Chema
          </Button>
        </div>
      </div>
    </article>
  );
}

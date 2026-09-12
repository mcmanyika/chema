"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Heart, Share2 } from "lucide-react";
import { CampaignUpdates } from "@/components/campaigns/CampaignUpdates";
import { ChemaBook } from "@/components/campaigns/ChemaBook";
import { GiveChemaModal } from "@/components/payments/GiveChemaModal";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaign, useCampaignUpdates, useChemaBook } from "@/hooks/useCampaigns";
import { canManageCampaign } from "@/lib/auth/roles";
import { formatDate, formatMoney, formatPeopleHaveGiven, initials } from "@/utils/format";
import { campaignPublicUrl, campaignShareText, whatsappShareUrl } from "@/utils/whatsapp";

export default function CampaignDetailPage() {
  const params = useParams<{ slug: string }>();
  const { campaign, loading } = useCampaign(params.slug);
  const { entries, loading: bookLoading } = useChemaBook(campaign?.id);
  const { updates } = useCampaignUpdates(campaign?.id);
  const { profile } = useAuth();
  const [giveOpen, setGiveOpen] = useState(false);

  if (loading) return <LoadingState label="Loading this Chema…" />;
  if (!campaign) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl">This Chema could not be found</h1>
        <Link href="/campaigns" className="mt-4 inline-block text-forest">
          Browse campaigns
        </Link>
      </div>
    );
  }

  const shareText = campaignShareText({
    deceasedName: campaign.deceasedName,
    contributorCount: campaign.contributorCount,
    amountRaised: campaign.amountRaised,
    currency: campaign.currency,
    campaignUrl: campaignPublicUrl(campaign.slug),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="overflow-hidden rounded-3xl bg-cream-dark">
            {campaign.deceasedPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaign.deceasedPhotoUrl}
                alt={campaign.deceasedName}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center font-serif text-6xl text-forest/40">
                {initials(campaign.deceasedName)}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl text-ink">{campaign.title}</h1>
            {campaign.verificationStatus === "verified" ? (
              <VerifiedBadge label="Verified campaign" />
            ) : (
              <span className="rounded-full bg-earth/10 px-2 py-0.5 text-xs text-earth">
                {campaign.verificationStatus.replace("_", " ")}
              </span>
            )}
          </div>
          <p className="mt-2 text-lg text-forest">{campaign.deceasedName}</p>
          <p className="mt-4 text-sm text-ink-muted">
            Organized by {campaign.organizerName ?? "a family member"}
            {campaign.communityName ? ` · ${campaign.communityName}` : ""}
          </p>
          <article className="mt-8 whitespace-pre-wrap text-base leading-8 text-ink">
            {campaign.description}
          </article>
          <div className="mt-10">
            <CampaignUpdates updates={updates} />
          </div>
          <div className="mt-6">
            <ChemaBook entries={entries} loading={bookLoading} />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-line bg-card p-6">
            <p className="font-serif text-4xl text-ink">
              {formatMoney(campaign.amountRaised, campaign.currency)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {campaign.goalAmount
                ? `raised of ${formatMoney(campaign.goalAmount, campaign.currency)} hoped for`
                : "raised with the family"}
            </p>
            <p className="mt-4 text-sm text-ink">
              {formatPeopleHaveGiven(campaign.contributorCount)}
            </p>
            <div className="mt-6 space-y-2 text-sm text-ink-muted">
              {campaign.location ? <p>Location: {campaign.location}</p> : null}
              {campaign.funeralDate ? <p>Funeral: {formatDate(campaign.funeralDate)}</p> : null}
              {campaign.closesAt ? <p>Closes: {formatDate(campaign.closesAt)}</p> : null}
            </div>
            <Button className="mt-6 w-full" onClick={() => setGiveOpen(true)}>
              <Heart className="h-4 w-4" />
              Give Chema
            </Button>
            <a
              href={whatsappShareUrl(shareText)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full border border-line text-sm text-ink hover:bg-cream"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </a>
            {canManageCampaign(profile?.role, campaign.organizerId, profile?.uid) ? (
              <Button
                href={`/campaigns/${campaign.id}/edit`}
                variant="ghost"
                className="mt-3 w-full"
              >
                Edit campaign
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
      <GiveChemaModal campaign={campaign} open={giveOpen} onClose={() => setGiveOpen(false)} />
    </div>
  );
}

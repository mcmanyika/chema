import type { Campaign } from "@/types";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

export function CampaignGrid({
  campaigns,
  onGive,
  showDescription = true,
}: {
  campaigns: Campaign[];
  onGive?: (campaign: Campaign) => void;
  showDescription?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onGive={onGive}
          showDescription={showDescription}
        />
      ))}
    </div>
  );
}

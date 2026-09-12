import type { Campaign } from "@/types";

export function matchesCampaignSearch(campaign: Campaign, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [campaign.title, campaign.deceasedName, campaign.location, campaign.communityName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

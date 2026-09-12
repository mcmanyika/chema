"use client";

import { useMemo, useState } from "react";
import { CampaignGrid } from "@/components/campaigns/CampaignGrid";
import { GiveChemaModal } from "@/components/payments/GiveChemaModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { matchesCampaignSearch } from "@/lib/campaigns/search";
import type { Campaign } from "@/types";

export default function CampaignsPage() {
  const { campaigns, loading } = useActiveCampaigns(48);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [query, setQuery] = useState("");
  const filteredCampaigns = useMemo(
    () => campaigns.filter((campaign) => matchesCampaignSearch(campaign, query)),
    [campaigns, query],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-4xl text-ink">Give Chema</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-muted">
            Choose a family to stand with. Every confirmed gift updates their page and your dashboard
            in real time.
          </p>
        </div>
        <Button href="/campaigns/create" variant="secondary">
          Start a Chema
        </Button>
      </div>
      {campaigns.length > 0 ? (
        <Input
          type="search"
          value={query}
          aria-label="Search campaigns"
          placeholder="Search family or campaign"
          className="mt-8 max-w-md"
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      <div className={campaigns.length > 0 ? "mt-6" : "mt-8"}>
        {loading ? (
          <LoadingState />
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No public campaigns yet"
            description="Verified campaigns will appear here after review."
          />
        ) : filteredCampaigns.length === 0 ? (
          <EmptyState
            title="No Chema matches that search"
            description="Try a family name or campaign title."
            action={
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <CampaignGrid campaigns={filteredCampaigns} onGive={setSelected} />
        )}
      </div>
      <GiveChemaModal campaign={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}

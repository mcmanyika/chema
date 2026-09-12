"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Input";
import { setCampaignStatusClient } from "@/lib/campaigns/client";
import type { Campaign, CampaignStatus } from "@/types";
import { cn } from "@/utils/cn";

export const CAMPAIGN_STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
];

export function campaignStatusLabel(status: CampaignStatus) {
  return CAMPAIGN_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function CampaignStatusSelect({
  campaign,
  className,
  id,
}: {
  campaign: Campaign;
  className?: string;
  id?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function changeStatus(status: CampaignStatus) {
    if (status === campaign.status) return;
    setBusy(true);
    try {
      await setCampaignStatusClient(campaign.id, status);
      toast.success(`${campaign.title} is now ${campaignStatusLabel(status).toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Select
      id={id}
      aria-label={`Status for ${campaign.title}`}
      className={cn("min-w-48", className)}
      value={campaign.status}
      disabled={busy}
      onChange={(event) => void changeStatus(event.target.value as CampaignStatus)}
    >
      {CAMPAIGN_STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

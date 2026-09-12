import { Input, Select } from "@/components/ui/Input";
import type { Contribution } from "@/types";
import { toDate } from "@/utils/format";

export type ContributionPeriod = "all" | "30d" | "90d" | "year";
export type ContributionAmountRange = "all" | "under50" | "50to200" | "over200";

export interface ContributionListFilters {
  query: string;
  campaignId: string;
  period: ContributionPeriod;
  amount: ContributionAmountRange;
}

export const defaultContributionFilters: ContributionListFilters = {
  query: "",
  campaignId: "",
  period: "all",
  amount: "all",
};

export function contributionLabel(contribution: Contribution): string {
  return contribution.campaignTitle ?? contribution.deceasedName ?? "Chema";
}

export function hasActiveContributionFilters(filters: ContributionListFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    Boolean(filters.campaignId) ||
    filters.period !== "all" ||
    filters.amount !== "all"
  );
}

export function campaignFilterOptions(contributions: Contribution[]) {
  const labels = new Map<string, string>();
  for (const item of contributions) {
    if (!labels.has(item.campaignId)) {
      labels.set(item.campaignId, contributionLabel(item));
    }
  }
  return [...labels.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function applyContributionFilters(
  contributions: Contribution[],
  filters: ContributionListFilters,
): Contribution[] {
  const query = filters.query.trim().toLowerCase();
  const now = Date.now();
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();

  return contributions.filter((item) => {
    if (filters.campaignId && item.campaignId !== filters.campaignId) return false;

    if (query) {
      const haystack = [item.campaignTitle, item.deceasedName, item.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.period !== "all") {
      const date = toDate(item.paidAt ?? item.createdAt);
      if (!date) return false;
      const time = date.getTime();
      if (filters.period === "30d" && time < now - 30 * 86_400_000) return false;
      if (filters.period === "90d" && time < now - 90 * 86_400_000) return false;
      if (filters.period === "year" && time < yearStart) return false;
    }

    if (filters.amount !== "all") {
      const dollars = item.amount / 100;
      if (filters.amount === "under50" && dollars >= 50) return false;
      if (filters.amount === "50to200" && (dollars < 50 || dollars > 200)) return false;
      if (filters.amount === "over200" && dollars <= 200) return false;
    }

    return true;
  });
}

export function ContributionFilters({
  value,
  onChange,
  campaigns,
}: {
  value: ContributionListFilters;
  onChange: (next: ContributionListFilters) => void;
  campaigns: { id: string; label: string }[];
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Input
        type="search"
        placeholder="Search family or campaign"
        value={value.query}
        aria-label="Search contributions"
        onChange={(event) => onChange({ ...value, query: event.target.value })}
      />
      <Select
        aria-label="Filter by campaign"
        value={value.campaignId}
        onChange={(event) => onChange({ ...value, campaignId: event.target.value })}
      >
        <option value="">All campaigns</option>
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.label}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by date"
        value={value.period}
        onChange={(event) =>
          onChange({ ...value, period: event.target.value as ContributionPeriod })
        }
      >
        <option value="all">All time</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="year">This year</option>
      </Select>
      <Select
        aria-label="Filter by amount"
        value={value.amount}
        onChange={(event) =>
          onChange({ ...value, amount: event.target.value as ContributionAmountRange })
        }
      >
        <option value="all">All amounts</option>
        <option value="under50">Under $50</option>
        <option value="50to200">$50–$200</option>
        <option value="over200">Over $200</option>
      </Select>
    </div>
  );
}

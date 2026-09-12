"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ContributionCard } from "@/components/dashboard/ContributionCard";
import {
  applyContributionFilters,
  campaignFilterOptions,
  ContributionFilters,
  defaultContributionFilters,
  hasActiveContributionFilters,
} from "@/components/dashboard/ContributionFilters";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCampaigns } from "@/hooks/useNotifications";
import { useMyContributions } from "@/hooks/useMyContributions";
import { useMyReferrals } from "@/hooks/useMyReferrals";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/utils/format";

function DashboardInner() {
  const { profile } = useAuth();
  const { contributions, loading, error, totalGiven, familiesSupported } = useMyContributions(
    profile?.uid,
  );
  const { campaigns } = useMyCampaigns(profile?.uid);
  const { count: referralCount } = useMyReferrals(profile?.uid);
  const reconciled = useRef(new Set<string>());

  useEffect(() => {
    for (const contribution of contributions) {
      if (contribution.status !== "pending" || reconciled.current.has(contribution.id)) continue;
      reconciled.current.add(contribution.id);
      void apiFetch("/api/stripe/reconcile", {
        method: "POST",
        body: JSON.stringify({ contributionId: contribution.id }),
      }).catch(() => {
        reconciled.current.delete(contribution.id);
      });
    }
  }, [contributions]);

  const paidContributions = contributions.filter((item) => item.status === "paid");
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultContributionFilters);
  const campaignOptions = useMemo(
    () => campaignFilterOptions(paidContributions),
    [paidContributions],
  );
  const filteredContributions = useMemo(
    () => applyContributionFilters(paidContributions, filters),
    [filters, paidContributions],
  );
  const filtersActive = hasActiveContributionFilters(filters);
  const totalPages = Math.max(1, Math.ceil(filteredContributions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedContributions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContributions.slice(start, start + pageSize);
  }, [currentPage, filteredContributions]);

  function updateFilters(next: typeof filters) {
    setFilters(next);
    setPage(1);
  }
  const communities = profile?.communityIds?.length ?? 0;
  const activeChema = campaigns.filter((item) => item.status === "active").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-earth">My Chema</p>
          <h1 className="mt-2 font-serif text-4xl text-ink">
            {profile?.firstName ? `Hello, ${profile.firstName}` : "Your dashboard"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/referrals" variant="secondary">
            Invite people
          </Button>
          <Button href="/campaigns">Give Chema</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard label="Total Given" value={formatMoney(totalGiven)} />
        <DashboardStatCard label="Families Supported" value={familiesSupported} />
        <DashboardStatCard label="Communities" value={communities} />
        <DashboardStatCard label="Active Chema" value={activeChema} />
        <DashboardStatCard label="Referrals" value={referralCount} hint="People who joined with your link" />
      </div>

      <section className="mt-10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h2 className="font-serif text-2xl text-ink">Recent Contributions</h2>
          {paidContributions.length > 0 ? (
            <p className="text-sm text-ink-muted">
              {filtersActive
                ? `${filteredContributions.length} of ${paidContributions.length} gifts`
                : `${paidContributions.length} ${paidContributions.length === 1 ? "gift" : "gifts"}`}
            </p>
          ) : null}
        </div>
        {paidContributions.length > 0 ? (
          <ContributionFilters
            value={filters}
            onChange={updateFilters}
            campaigns={campaignOptions}
          />
        ) : null}
        {filtersActive ? (
          <button
            type="button"
            className="mt-3 text-sm text-forest hover:underline"
            onClick={() => updateFilters(defaultContributionFilters)}
          >
            Clear filters
          </button>
        ) : null}
        {loading ? (
          <LoadingState label="Listening for your contributions…" />
        ) : error ? (
          <p className="mt-4 text-sm text-danger">{error}</p>
        ) : paidContributions.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="You have not given Chema yet"
              description="When you support a family, the gift will appear here as soon as Stripe confirms it."
              action={
                <Button href="/campaigns">Browse campaigns</Button>
              }
            />
          </div>
        ) : filteredContributions.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No gifts match these filters"
              description="Try a different search, campaign, date, or amount."
              action={
                <Button
                  variant="secondary"
                  onClick={() => updateFilters(defaultContributionFilters)}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {pagedContributions.map((contribution) => (
              <ContributionCard key={contribution.id} contribution={contribution} />
            ))}
          </div>
        )}
        {filteredContributions.length > pageSize ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <p className="text-sm text-ink-muted">
              Page {currentPage} of {totalPages}
            </p>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}

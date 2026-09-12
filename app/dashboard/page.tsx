"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ContributionCard } from "@/components/dashboard/ContributionCard";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCampaigns } from "@/hooks/useNotifications";
import { useMyContributions } from "@/hooks/useMyContributions";
import { formatMoney } from "@/utils/format";

function DashboardInner() {
  const { profile } = useAuth();
  const { contributions, loading, error, totalGiven, familiesSupported } = useMyContributions(
    profile?.uid,
  );
  const { campaigns } = useMyCampaigns(profile?.uid);
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
          <p className="mt-2 text-sm text-ink-muted">
            Successful gifts appear here automatically after Stripe confirms them.
          </p>
        </div>
        <Button href="/campaigns">Give Chema</Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Total Given" value={formatMoney(totalGiven)} />
        <DashboardStatCard label="Families Supported" value={familiesSupported} />
        <DashboardStatCard label="Communities" value={communities} />
        <DashboardStatCard label="Active Chema" value={activeChema} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Recent Contributions</h2>
        {loading ? (
          <LoadingState label="Listening for your contributions…" />
        ) : error ? (
          <p className="mt-4 text-sm text-danger">{error}</p>
        ) : contributions.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="You have not given Chema yet"
              description="When you support a family, the gift will appear here as soon as Stripe confirms it."
              action={
                <Button href="/campaigns">Browse campaigns</Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {contributions.map((contribution) => (
              <ContributionCard key={contribution.id} contribution={contribution} />
            ))}
          </div>
        )}
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

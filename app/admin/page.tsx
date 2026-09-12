"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CampaignStatusSelect } from "@/components/campaigns/CampaignStatusSelect";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { verifyCampaignClient } from "@/lib/campaigns/client";
import { useAdminCampaigns, usePendingCampaigns } from "@/hooks/useCampaigns";
import { formatDate } from "@/utils/format";

function AdminInner() {
  const { campaigns: pending, loading: pendingLoading } = usePendingCampaigns();
  const { campaigns, loading } = useAdminCampaigns();

  async function verify(id: string) {
    try {
      await verifyCampaignClient(id);
      toast.success("Campaign verified.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl">Admin</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Review campaigns before they become public. Verification is a human decision.
      </p>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Pending verification</h2>
        {pendingLoading ? (
          <LoadingState />
        ) : pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Nothing waiting for review" />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((campaign) => (
              <li key={campaign.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <Link href={`/campaigns/${campaign.slug}`} className="font-medium hover:underline">
                      {campaign.title}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      {campaign.deceasedName} · submitted {formatDate(campaign.createdAt)}
                    </p>
                  </div>
                  <Button onClick={() => void verify(campaign.id)}>Verify</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Campaign status</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Change whether a campaign is public, paused, or closed.
        </p>
        {loading ? (
          <LoadingState />
        ) : campaigns.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No campaigns yet" />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <Link href={`/campaigns/${campaign.slug}`} className="font-medium hover:underline">
                      {campaign.title}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      {campaign.deceasedName} · {campaign.verificationStatus}
                    </p>
                  </div>
                  <CampaignStatusSelect campaign={campaign} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminInner />
    </ProtectedRoute>
  );
}

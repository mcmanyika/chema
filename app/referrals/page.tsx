"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useMyReferrals } from "@/hooks/useMyReferrals";
import { referralShareText, referralSignupUrl } from "@/lib/referrals/client";
import { whatsappShareUrl } from "@/utils/whatsapp";

function ReferralsInner() {
  const { firebaseUser, profile } = useAuth();
  const userId = firebaseUser?.uid ?? profile?.uid;
  const { referrals, loading, count } = useMyReferrals(userId);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const link = userId ? referralSignupUrl(userId) : "";
  const totalPages = Math.max(1, Math.ceil(referrals.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return referrals.slice(start, start + pageSize);
  }, [currentPage, referrals]);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied.");
    } catch {
      toast.error("Unable to copy the link.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm uppercase tracking-[0.18em] text-earth">Invite your people</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">Referrals</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Share your Chema link. When someone joins through it, they appear here.
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <p className="text-sm text-ink-muted">Your referral link</p>
        <p className="mt-2 break-all text-sm text-ink">{link || "Sign in to get your link."}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button size="sm" onClick={() => void copyLink()} disabled={!link}>
            Copy link
          </Button>
          {link ? (
            <Button
              size="sm"
              variant="secondary"
              href={whatsappShareUrl(
                referralShareText(profile?.displayName ?? profile?.firstName ?? "I", link),
              )}
            >
              Share on WhatsApp
            </Button>
          ) : null}
        </div>
      </section>

      <div className="mt-8 rounded-2xl border border-line bg-card p-5">
        <p className="text-sm text-ink-muted">People who joined</p>
        <p className="mt-2 font-serif text-3xl text-ink">{count}</p>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Your referrals</h2>
        {loading ? (
          <LoadingState label="Loading referrals…" />
        ) : referrals.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No referrals yet"
              description="Share your link with family, church, or hometown circles."
              action={<Button onClick={() => void copyLink()}>Copy your link</Button>}
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
            {paged.map((referral) => (
              <li key={referral.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{referral.displayName}</span>
                <span className="text-ink-muted">Joined</span>
              </li>
            ))}
          </ul>
        )}
        {referrals.length > pageSize ? (
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

export default function ReferralsPage() {
  return (
    <ProtectedRoute>
      <ReferralsInner />
    </ProtectedRoute>
  );
}

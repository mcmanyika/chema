"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CampaignStatusSelect } from "@/components/campaigns/CampaignStatusSelect";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCampaigns } from "@/hooks/useNotifications";
import { isAdminRole } from "@/lib/auth/roles";

function ProfileInner() {
  const { profile, signOut } = useAuth();
  const { campaigns } = useMyCampaigns(profile?.uid);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-2xl text-white">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-3xl">{profile.displayName}</h1>
            <p className="text-sm text-ink-muted">{profile.email}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-earth">
              {profile.role.replaceAll("_", " ")}
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm">
          <p className="text-ink-muted">Your Chema user ID</p>
          <p className="mt-1 break-all font-medium">{profile.uid}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Button href="/settings">Settings</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Campaigns you organize</h2>
        <ul className="mt-4 space-y-3">
          {campaigns.map((campaign) => (
            <li
              key={campaign.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 sm:flex-row sm:items-center"
            >
              <div>
                <Link href={`/campaigns/${campaign.slug}`} className="font-medium hover:underline">
                  {campaign.title}
                </Link>
                <p className="text-sm text-ink-muted">
                  {campaign.status.replaceAll("_", " ")} · {campaign.verificationStatus}
                </p>
              </div>
              {isAdminRole(profile.role) ? <CampaignStatusSelect campaign={campaign} /> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}

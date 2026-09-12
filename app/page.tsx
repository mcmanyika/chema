"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Handshake, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { CampaignGrid } from "@/components/campaigns/CampaignGrid";
import { GiveChemaModal } from "@/components/payments/GiveChemaModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { useCommunities } from "@/hooks/useCommunities";
import type { Campaign } from "@/types";

export default function HomePage() {
  const { campaigns, loading } = useActiveCampaigns(6);
  const { communities } = useCommunities();
  const [selected, setSelected] = useState<Campaign | null>(null);

  return (
    <>
      <section className="border-b border-line bg-[#f6f3ee]">
        <h1 className="sr-only">No family mourns alone.</h1>
        <div className="relative w-full">
          <Image
            src="/banner_4.png"
            alt="Chema — People. Community. Always. No family mourns alone."
            width={1774}
            height={887}
            priority
            className="h-auto w-full"
          />
          <div className="absolute inset-0 hidden sm:block">
            <Link
              href="/campaigns"
              aria-label="Give Chema"
              className="absolute left-[5.4%] top-[46.8%] h-[7.8%] w-[14.2%]"
            />
            <Link
              href="/campaigns/create"
              aria-label="Start a Chema"
              className="absolute left-[20.6%] top-[46.8%] h-[7.8%] w-[15.4%]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 px-4 py-6 sm:hidden">
          <Button href="/campaigns" size="lg" className="w-full">
            Give Chema
          </Button>
          <Button href="/campaigns/create" size="lg" variant="secondary" className="w-full">
            Start a Chema
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl text-ink">Active Chema</h2>
            <p className="mt-2 text-sm text-ink-muted">Families being held by their people right now.</p>
          </div>
          <Link href="/campaigns" className="hidden text-sm text-forest sm:block">
            View all
          </Link>
        </div>
        {loading ? (
          <LoadingState label="Loading campaigns…" />
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No active Chema yet"
            description="When a family is ready, their campaign will appear here for the community to gather around."
            action={<Button href="/campaigns/create">Start a Chema</Button>}
          />
        ) : (
          <CampaignGrid campaigns={campaigns} onGive={setSelected} />
        )}
      </section>

      <section className="bg-forest text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: "Start a Chema",
              body: "A family member or trusted friend shares the story, funeral details, and who should receive support.",
            },
            {
              icon: Handshake,
              title: "Give with dignity",
              body: "Friends at home and abroad give what they can. The family’s amount is never quietly reduced.",
            },
            {
              icon: Users,
              title: "Stand together",
              body: "Contributions, messages, and updates gather in one place so no family has to coordinate grief alone.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-7 w-7 text-white/80" />
              <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-white/80">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-serif text-3xl text-ink">Communities</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-muted">
          Churches, hometown associations, alumni groups, and family circles can gather around their own.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {communities.slice(0, 3).map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}`}
              className="rounded-2xl border border-line bg-card p-5"
            >
              <h3 className="font-serif text-xl">{community.name}</h3>
              <p className="mt-2 text-sm text-ink-muted">{community.memberCount} members</p>
            </Link>
          ))}
          {communities.length === 0 ? (
            <div className="sm:col-span-3">
              <EmptyState
                title="Your community can begin here"
                description="Create a public or private circle for your church, hometown, or family association."
                action={
                  <Button href="/communities" variant="secondary">
                    Explore communities
                  </Button>
                }
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-7 w-7 text-forest" />
            <div>
              <h2 className="font-serif text-3xl text-ink">Trust and transparency</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-muted">
                Campaigns are verified before they go live. Successful gifts are confirmed by Stripe
                webhooks, not by the browser. Totals update from trusted server records, and optional
                platform support is always shown separately from the family’s Chema.
              </p>
            </div>
          </div>
        </div>
      </section>

      <GiveChemaModal campaign={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </>
  );
}

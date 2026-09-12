"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Handshake, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { CampaignGrid } from "@/components/campaigns/CampaignGrid";
import { GiveChemaModal } from "@/components/payments/GiveChemaModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { useCommunities } from "@/hooks/useCommunities";
import { matchesCampaignSearch } from "@/lib/campaigns/search";
import type { Campaign } from "@/types";

export default function HomePage() {
  const { campaigns, loading } = useActiveCampaigns(48);
  const { communities } = useCommunities();
  const [selected, setSelected] = useState<Campaign | null>(null);
  const pageSize = 3;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const filteredCampaigns = useMemo(
    () => campaigns.filter((campaign) => matchesCampaignSearch(campaign, query)),
    [campaigns, query],
  );
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [currentPage, filteredCampaigns]);

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
        <h2 className="sr-only">Campaigns</h2>
        {campaigns.length > 0 ? (
          <div className="mb-6 flex items-center justify-between gap-4">
            <Input
              type="search"
              value={query}
              aria-label="Search campaigns"
              placeholder="Search family or campaign"
              className="max-w-md"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            <Link href="/campaigns" className="hidden shrink-0 text-sm text-forest sm:block">
              View all
            </Link>
          </div>
        ) : null}
        {loading ? (
          <LoadingState label="Loading campaigns…" />
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No active Chema yet"
            description="When a family is ready, their campaign will appear here for the community to gather around."
            action={<Button href="/campaigns/create">Start a Chema</Button>}
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
          <>
            <CampaignGrid
              campaigns={pagedCampaigns}
              onGive={setSelected}
              showDescription={false}
            />
            {filteredCampaigns.length > pageSize ? (
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
          </>
        )}
      </section>

      <section className="bg-forest text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: "Start a Chema",
            },
            {
              icon: Handshake,
              title: "Give with dignity",
            },
            {
              icon: Users,
              title: "Stand together",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-7 w-7 text-white/80" />
              <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
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

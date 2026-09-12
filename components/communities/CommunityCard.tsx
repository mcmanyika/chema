import Link from "next/link";
import type { Community } from "@/types";
import { truncate } from "@/utils/format";

export function CommunityCard({ community }: { community: Community }) {
  return (
    <article className="rounded-2xl border border-line bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{community.privacy}</p>
      <h3 className="mt-1 font-serif text-2xl text-ink">
        <Link href={`/communities/${community.id}`} className="hover:underline">
          {community.name}
        </Link>
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{truncate(community.description, 150)}</p>
      <p className="mt-4 text-sm text-forest">
        {community.memberCount.toLocaleString("en-US")}{" "}
        {community.memberCount === 1 ? "member" : "members"}
      </p>
    </article>
  );
}

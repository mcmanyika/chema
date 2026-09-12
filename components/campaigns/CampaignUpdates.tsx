import type { CampaignUpdate } from "@/types";
import { formatDate } from "@/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";

export function CampaignUpdates({ updates }: { updates: CampaignUpdate[] }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      <h2 className="font-serif text-2xl text-ink">Campaign updates</h2>
      {updates.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No updates yet"
            description="The organizer will share funeral and family updates here."
          />
        </div>
      ) : (
        <ol className="mt-5 space-y-5">
          {updates.map((update) => (
            <li key={update.id} className="border-l-2 border-forest/20 pl-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                {formatDate(update.createdAt)} · {update.authorName}
              </p>
              <h3 className="mt-1 font-medium text-ink">{update.title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-muted">{update.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

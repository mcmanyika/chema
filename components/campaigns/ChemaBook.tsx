import type { ChemaBookEntry as ChemaBookEntryType } from "@/types";
import { ChemaBookEntry } from "@/components/campaigns/ChemaBookEntry";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";

export function ChemaBook({
  entries,
  loading,
}: {
  entries: ChemaBookEntryType[];
  loading?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      <h2 className="font-serif text-2xl text-ink">Chema Book</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Messages of presence from those standing with the family.
      </p>
      {loading ? (
        <LoadingState label="Loading the Chema Book…" />
      ) : entries.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="The book is still opening"
            description="The first messages of support will appear here after a Chema is received."
          />
        </div>
      ) : (
        <ul className="mt-4">
          {entries.map((entry) => (
            <ChemaBookEntry key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}

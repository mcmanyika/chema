import type { ChemaBookEntry as ChemaBookEntryType } from "@/types";
import { formatMoney } from "@/utils/format";

export function ChemaBookEntry({ entry }: { entry: ChemaBookEntryType }) {
  return (
    <li className="border-b border-line py-4 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-ink">{entry.displayName}</p>
        <p className="font-serif text-lg text-forest">
          {formatMoney(entry.amount, entry.currency)}
        </p>
      </div>
      {entry.message ? (
        <p className="mt-1 text-sm leading-6 text-ink-muted italic">“{entry.message}”</p>
      ) : null}
    </li>
  );
}

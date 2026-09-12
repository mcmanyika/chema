import type { ReactNode } from "react";

export function DashboardStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl border border-line bg-card p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </article>
  );
}

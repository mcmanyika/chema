import { cn } from "@/utils/cn";

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-16 text-ink-muted", className)}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-forest" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-cream-dark", className)} />;
}

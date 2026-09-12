import type { FirestoreDate } from "@/types";

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatMoney(
  cents: number,
  currency = "USD",
  options?: { compact?: boolean },
): string {
  const value = centsToDollars(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: options?.compact && value >= 1000 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPeopleHaveGiven(count: number): string {
  const label = count === 1 ? "person has" : "people have";
  return `${count.toLocaleString("en-US")} ${label} given Chema`;
}

export function toDate(value?: FirestoreDate | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if ("toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  if ("seconds" in value) {
    return new Date(value.seconds * 1000);
  }
  return null;
}

export function formatDate(value?: FirestoreDate | null, fallback = "—"): string {
  const date = toDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(value?: FirestoreDate | null): string {
  const date = toDate(value);
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, length = 140): string {
  const trimmed = text.trim();
  if (trimmed.length <= length) return trimmed;
  return `${trimmed.slice(0, length).trimEnd()}…`;
}

import { formatMoney, formatPeopleHaveGiven } from "@/utils/format";

export function campaignShareText(input: {
  deceasedName: string;
  familyHint?: string;
  contributorCount: number;
  amountRaised: number;
  currency: string;
  campaignUrl: string;
}): string {
  const family = input.familyHint ?? `${input.deceasedName.split(" ").slice(-1)[0] ?? input.deceasedName} family`;

  return [
    `🕊️ CHEMA — In Memory of ${input.deceasedName}`,
    "",
    `Family and friends are coming together to support the ${family}.`,
    "",
    `${formatPeopleHaveGiven(input.contributorCount)}.`,
    `${formatMoney(input.amountRaised, input.currency)} raised.`,
    "",
    "Give Chema:",
    input.campaignUrl,
  ].join("\n");
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function campaignPublicUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/campaigns/${slug}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/campaigns/${slug}`;
  }
  return `/campaigns/${slug}`;
}

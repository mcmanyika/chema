import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";

const STORAGE_KEY = "chema.referralCode";

export function peekStoredReferral(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY)?.trim();
  return value || null;
}

export function storeReferralCode(code: string) {
  if (typeof window === "undefined") return;
  const trimmed = code.trim();
  if (!trimmed) return;
  window.localStorage.setItem(STORAGE_KEY, trimmed);
}

export function clearStoredReferral() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function referralSignupUrl(referrerId: string) {
  const path = `/register?ref=${encodeURIComponent(referrerId)}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return base ? `${base}${path}` : path;
}

export function referralShareText(referrerName: string, url: string) {
  const name = referrerName.trim() || "A friend";
  return [
    `${name} invited you to Chema.`,
    "",
    "Stand with families when they need their people most.",
    "",
    url,
  ].join("\n");
}

export async function recordReferral(input: {
  referrerId: string;
  referredUserId: string;
  displayName: string;
}) {
  if (!input.referrerId || input.referrerId === input.referredUserId) return;
  await setDoc(doc(getClientDb(), "referrals", input.referredUserId), {
    referrerId: input.referrerId,
    referredUserId: input.referredUserId,
    displayName: input.displayName,
    createdAt: serverTimestamp(),
  });
  clearStoredReferral();
}

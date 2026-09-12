import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;
let resolvedKey: string | null = null;

function asPublishableKey(value?: string | null): string | null {
  const key = value?.trim() ?? "";
  if (!key || key.startsWith("sk_") || !key.startsWith("pk_")) return null;
  return key;
}

export function getStripePublishableKey(): string | null {
  return asPublishableKey(resolvedKey) ?? asPublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export async function resolveStripePublishableKey(): Promise<string | null> {
  const fromEnv = getStripePublishableKey();
  if (fromEnv) {
    resolvedKey = fromEnv;
    return fromEnv;
  }

  const response = await fetch("/api/stripe/config", { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as { publishableKey?: string | null };
  resolvedKey = asPublishableKey(payload.publishableKey);
  return resolvedKey;
}

export function getStripePromise(publishableKey?: string | null): Promise<Stripe | null> {
  const key = asPublishableKey(publishableKey) ?? getStripePublishableKey();
  if (!key) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

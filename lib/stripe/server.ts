import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (key.startsWith("pk_")) {
    throw new Error("STRIPE_SECRET_KEY is a publishable key. Use the secret key that starts with sk_.");
  }
  if (!key.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export function hostnameFromRequest(request: Request): string | null {
  const candidates = [request.headers.get("origin"), request.headers.get("referer"), appUrl()];
  for (const value of candidates) {
    if (!value) continue;
    try {
      const host = new URL(value).hostname;
      if (host) return host;
    } catch {
      continue;
    }
  }
  return null;
}

export async function ensurePaymentMethodDomain(hostname: string | null) {
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") return;

  const stripe = getStripe();
  const existing = await stripe.paymentMethodDomains.list({ limit: 100 });
  const match = existing.data.find((item) => item.domain_name === hostname);
  if (match) {
    if (!match.enabled) {
      await stripe.paymentMethodDomains.update(match.id, { enabled: true });
    }
    return;
  }

  await stripe.paymentMethodDomains.create({ domain_name: hostname });
}

export function deriveConnectStatus(account: Stripe.Account) {
  if (account.payouts_enabled) return "payouts_enabled" as const;
  if (account.charges_enabled && account.details_submitted) return "verified" as const;
  if (account.details_submitted) return "onboarding_incomplete" as const;
  return "onboarding_incomplete" as const;
}

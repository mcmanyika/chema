import { FieldValue, type Transaction } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { deriveConnectStatus, getStripe, getWebhookSecret } from "@/lib/stripe/server";
import { createNotification } from "@/lib/server/notifications";
import { jsonError, jsonOk } from "@/lib/api/http";
import type { Contribution, UserProfile } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonError("Missing Stripe signature.", 400);
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return jsonError("Invalid Stripe signature.", 400);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.id, event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.id, event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.id, event.data.object as Stripe.Charge);
        break;
      case "account.updated":
        await handleAccountUpdated(event.id, event.data.object as Stripe.Account);
        break;
      default:
        break;
    }

    return jsonOk({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return jsonError("Webhook processing failed.", 500);
  }
}

async function alreadyProcessed(tx: Transaction, eventId: string): Promise<boolean> {
  const snap = await tx.get(getAdminDb().collection("processedStripeEvents").doc(eventId));
  return snap.exists;
}

function markProcessed(tx: Transaction, eventId: string, type: string) {
  tx.set(getAdminDb().collection("processedStripeEvents").doc(eventId), {
    type,
    processedAt: FieldValue.serverTimestamp(),
  });
}

function bookDisplayName(profile: UserProfile | undefined, anonymous: boolean): string {
  if (anonymous || !profile) return "Anonymous";
  if (profile.firstName && profile.lastName) {
    return `${profile.firstName[0]}. ${profile.lastName}`;
  }
  return profile.displayName || "Anonymous";
}

async function handlePaymentSucceeded(eventId: string, paymentIntent: Stripe.PaymentIntent) {
  const { userId, campaignId, contributionId, paymentId } = paymentIntent.metadata;
  if (!userId || !campaignId || !contributionId) {
    throw new Error("PaymentIntent is missing required metadata.");
  }

  const db = getAdminDb();

  await db.runTransaction(async (tx) => {
    if (await alreadyProcessed(tx, eventId)) return;

    const contributionRef = db.collection("contributions").doc(contributionId);
    const contributionSnap = await tx.get(contributionRef);
    if (!contributionSnap.exists) {
      throw new Error("Contribution not found for succeeded payment.");
    }

    const contribution = contributionSnap.data() as Contribution;
    const campaignRef = db.collection("campaigns").doc(campaignId);
    const campaignSnap = await tx.get(campaignRef);
    const userSnap = await tx.get(db.collection("users").doc(userId));
    const profile = userSnap.exists
      ? ({ uid: userSnap.id, ...(userSnap.data() as Omit<UserProfile, "uid">) } satisfies UserProfile)
      : undefined;

    markProcessed(tx, eventId, "payment_intent.succeeded");

    if (contribution.status === "paid") {
      return;
    }

    tx.update(contributionRef, {
      status: "paid",
      stripePaymentIntentId: paymentIntent.id,
      paidAt: FieldValue.serverTimestamp(),
    });

    const resolvedPaymentId = paymentId || contributionId;
    tx.set(
      db.collection("payments").doc(resolvedPaymentId),
      {
        userId,
        campaignId,
        contributionId,
        stripePaymentIntentId: paymentIntent.id,
        grossAmount: paymentIntent.amount,
        platformSupportAmount: Math.max(0, paymentIntent.amount - contribution.amount),
        currency: (paymentIntent.currency || "usd").toUpperCase(),
        status: "paid",
        paidAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (campaignSnap.exists) {
      tx.update(campaignRef, {
        amountRaised: FieldValue.increment(contribution.amount),
        contributorCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    tx.set(db.collection("campaigns").doc(campaignId).collection("chemaBook").doc(), {
      displayName: bookDisplayName(profile, contribution.anonymous),
      amount: contribution.amount,
      currency: contribution.currency,
      message: contribution.message ?? "",
      anonymous: contribution.anonymous,
      contributionId,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const campaignSnap = await db.collection("campaigns").doc(campaignId).get();
  const organizerId = campaignSnap.data()?.organizerId as string | undefined;
  if (organizerId) {
    await createNotification({
      userId: organizerId,
      type: "payment_received",
      title: "Chema received",
      body: "A contribution was confirmed for your campaign.",
      campaignId,
      href: `/campaigns/${campaignSnap.data()?.slug ?? campaignId}`,
    });
  }
}

async function handlePaymentFailed(eventId: string, paymentIntent: Stripe.PaymentIntent) {
  const contributionId = paymentIntent.metadata.contributionId;
  const paymentId = paymentIntent.metadata.paymentId;
  if (!contributionId) return;

  const db = getAdminDb();
  await db.runTransaction(async (tx) => {
    if (await alreadyProcessed(tx, eventId)) return;
    const contributionRef = db.collection("contributions").doc(contributionId);
    const snap = await tx.get(contributionRef);
    markProcessed(tx, eventId, "payment_intent.payment_failed");
    if (!snap.exists) return;
    if (snap.data()?.status === "paid") return;
    tx.update(contributionRef, {
      status: "failed",
      stripePaymentIntentId: paymentIntent.id,
    });
    if (paymentId) {
      tx.set(
        db.collection("payments").doc(paymentId),
        { status: "failed", stripePaymentIntentId: paymentIntent.id },
        { merge: true },
      );
    }
  });
}

async function handleChargeRefunded(eventId: string, charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const db = getAdminDb();
  const matches = await db
    .collection("contributions")
    .where("stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();
  if (matches.empty) return;

  const contributionDoc = matches.docs[0]!;
  await db.runTransaction(async (tx) => {
    if (await alreadyProcessed(tx, eventId)) return;
    const fresh = await tx.get(contributionDoc.ref);
    const data = fresh.data() as Contribution | undefined;
    markProcessed(tx, eventId, "charge.refunded");
    if (!data || data.status === "refunded") return;

    tx.update(contributionDoc.ref, { status: "refunded" });
    if (data.status === "paid") {
      tx.update(db.collection("campaigns").doc(data.campaignId), {
        amountRaised: FieldValue.increment(-data.amount),
        contributorCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}

async function handleAccountUpdated(eventId: string, account: Stripe.Account) {
  const db = getAdminDb();
  const status = deriveConnectStatus(account);

  await db.runTransaction(async (tx) => {
    if (await alreadyProcessed(tx, eventId)) return;
    markProcessed(tx, eventId, "account.updated");
  });

  const users = await db
    .collection("users")
    .where("stripeConnectedAccountId", "==", account.id)
    .limit(5)
    .get();

  const payload = {
    stripeConnectStatus: status,
    stripeChargesEnabled: account.charges_enabled,
    stripePayoutsEnabled: account.payouts_enabled,
    stripeDetailsSubmitted: account.details_submitted,
  };

  await Promise.all(users.docs.map((doc) => doc.ref.set(payload, { merge: true })));

  const campaigns = await db
    .collection("campaigns")
    .where("stripeConnectedAccountId", "==", account.id)
    .get();
  await Promise.all(campaigns.docs.map((doc) => doc.ref.set({ stripeConnectedAccountId: account.id }, { merge: true })));
}

import "server-only";

import { FieldValue, type Transaction } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { createNotification } from "@/lib/server/notifications";
import type { Contribution, UserProfile } from "@/types";

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

export async function fulfillSuccessfulPayment(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string,
) {
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

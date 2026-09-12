import { getAdminDb } from "@/lib/firebase/admin";
import { fulfillSuccessfulPayment } from "@/lib/stripe/fulfill-payment";
import { getStripe } from "@/lib/stripe/server";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";
import { reconcilePaymentSchema } from "@/lib/validations";
import type { Contribution } from "@/types";

export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const parsed = reconcilePaymentSchema.parse(await request.json());
    const db = getAdminDb();
    const contributionRef = db.collection("contributions").doc(parsed.contributionId);
    const snap = await contributionRef.get();
    if (!snap.exists) {
      return jsonError("Contribution not found.", 404);
    }

    const contribution = { id: snap.id, ...(snap.data() as Omit<Contribution, "id">) };
    if (contribution.userId !== auth.user.uid) {
      return jsonError("You cannot confirm this contribution.", 403);
    }
    if (contribution.status === "paid") {
      return jsonOk({ status: "paid" });
    }
    if (!contribution.stripePaymentIntentId) {
      return jsonError("This contribution is not linked to a Stripe payment yet.", 400);
    }

    const stripe = getStripe();
    let paymentIntent = await stripe.paymentIntents.retrieve(contribution.stripePaymentIntentId);

    for (let attempt = 0; attempt < 6 && paymentIntent.status !== "succeeded"; attempt += 1) {
      await sleep(500);
      paymentIntent = await stripe.paymentIntents.retrieve(contribution.stripePaymentIntentId);
    }

    if (paymentIntent.status === "succeeded") {
      await fulfillSuccessfulPayment(paymentIntent, `reconcile_${paymentIntent.id}`);
      return jsonOk({ status: "paid" });
    }

    if (paymentIntent.status === "canceled" || paymentIntent.status === "requires_payment_method") {
      await contributionRef.update({ status: "failed" });
      return jsonOk({ status: "failed" });
    }

    return jsonOk({ status: contribution.status });
  } catch (error) {
    return handleRouteError(error);
  }
}

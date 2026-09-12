import { FieldValue } from "firebase-admin/firestore";
import { createPaymentIntentSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe/server";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";
import type { Campaign, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const parsed = createPaymentIntentSchema.parse(await request.json());
    const db = getAdminDb();
    const campaignSnap = await db.collection("campaigns").doc(parsed.campaignId).get();
    if (!campaignSnap.exists) {
      return jsonError("This campaign was not found.", 404);
    }

    const campaign = { id: campaignSnap.id, ...(campaignSnap.data() as Omit<Campaign, "id">) };
    if (campaign.status !== "active") {
      return jsonError("This Chema is not currently accepting gifts.", 400);
    }

    const contributionRef = db.collection("contributions").doc();
    const paymentRef = db.collection("payments").doc();
    const currency = campaign.currency.toLowerCase();
    const grossAmount = parsed.amount + parsed.platformSupportAmount;

    await contributionRef.set({
      userId: auth.user.uid,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      deceasedName: campaign.deceasedName,
      amount: parsed.amount,
      currency: campaign.currency,
      anonymous: parsed.anonymous,
      message: parsed.message ?? "",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    await paymentRef.set({
      userId: auth.user.uid,
      campaignId: campaign.id,
      contributionId: contributionRef.id,
      grossAmount,
      platformSupportAmount: parsed.platformSupportAmount,
      currency: campaign.currency,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    const destinationAccountId = await resolveDestinationAccount(campaign);
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: grossAmount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: auth.user.uid,
        campaignId: campaign.id,
        contributionId: contributionRef.id,
        paymentId: paymentRef.id,
      },
      ...(destinationAccountId
        ? {
            application_fee_amount: parsed.platformSupportAmount,
            transfer_data: { destination: destinationAccountId },
          }
        : {}),
    });

    await contributionRef.update({
      stripePaymentIntentId: paymentIntent.id,
    });
    await paymentRef.update({
      stripePaymentIntentId: paymentIntent.id,
    });

    return jsonOk({
      clientSecret: paymentIntent.client_secret,
      contributionId: contributionRef.id,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function resolveDestinationAccount(campaign: Campaign): Promise<string | null> {
  if (campaign.beneficiaryId) {
    const beneficiary = await getAdminDb().collection("users").doc(campaign.beneficiaryId).get();
    if (beneficiary.exists) {
      const data = beneficiary.data() as UserProfile;
      if (data.stripePayoutsEnabled && data.stripeConnectedAccountId) {
        return data.stripeConnectedAccountId;
      }
    }
  }

  return null;
}

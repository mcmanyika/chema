import { connectAccountSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { deriveConnectStatus, getStripe } from "@/lib/stripe/server";
import { handleRouteError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = connectAccountSchema.parse(body);
    const db = getAdminDb();

    if (auth.profile.stripeConnectedAccountId) {
      const existing = await getStripe().accounts.retrieve(auth.profile.stripeConnectedAccountId);
      return jsonOk({
        accountId: existing.id,
        status: deriveConnectStatus(existing),
      });
    }

    const account = await getStripe().accounts.create({
      type: "express",
      country: parsed.country,
      email: auth.profile.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { userId: auth.user.uid },
    });

    await db.collection("users").doc(auth.user.uid).set(
      {
        stripeConnectedAccountId: account.id,
        stripeConnectStatus: "onboarding_incomplete",
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
      },
      { merge: true },
    );

    return jsonOk({ accountId: account.id, status: "onboarding_incomplete" });
  } catch (error) {
    return handleRouteError(error);
  }
}

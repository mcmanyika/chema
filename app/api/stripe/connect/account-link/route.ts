import { getStripe, appUrl } from "@/lib/stripe/server";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;
    if (!auth.profile.stripeConnectedAccountId) {
      return jsonError("Create a connected account first.", 400);
    }

    const link = await getStripe().accountLinks.create({
      account: auth.profile.stripeConnectedAccountId,
      refresh_url: `${appUrl()}/settings?connect=refresh`,
      return_url: `${appUrl()}/settings?connect=return`,
      type: "account_onboarding",
    });

    return jsonOk({ url: link.url });
  } catch (error) {
    return handleRouteError(error);
  }
}

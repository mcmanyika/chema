import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireAdmin, requireUser } from "@/lib/server/auth";
import { createNotification } from "@/lib/server/notifications";
import type { Campaign } from "@/types";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser(_request);
    if (auth.error) return auth.error;
    const denied = requireAdmin(auth.profile);
    if (denied) return denied;

    const { id } = await context.params;
    const ref = getAdminDb().collection("campaigns").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return jsonError("Campaign not found.", 404);

    const campaign = snap.data() as Campaign;
    await ref.update({
      status: "active",
      verificationStatus: "verified",
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createNotification({
      userId: campaign.organizerId,
      type: "campaign_verified",
      title: "Your Chema is verified",
      body: `${campaign.title} is now public and can receive gifts.`,
      campaignId: id,
      href: `/campaigns/${campaign.slug}`,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { FieldValue } from "firebase-admin/firestore";
import { campaignUpdateSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { canManageCampaign } from "@/lib/auth/roles";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";
import { createNotification } from "@/lib/server/notifications";
import type { Campaign } from "@/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const parsed = campaignUpdateSchema.parse(await request.json());
    const db = getAdminDb();
    const campaignRef = db.collection("campaigns").doc(id);
    const snap = await campaignRef.get();
    if (!snap.exists) return jsonError("Campaign not found.", 404);

    const campaign = snap.data() as Campaign;
    if (!canManageCampaign(auth.profile.role, campaign.organizerId, auth.user.uid)) {
      return jsonError("You cannot post updates for this campaign.", 403);
    }

    await campaignRef.collection("updates").add({
      title: parsed.title,
      body: parsed.body,
      authorId: auth.user.uid,
      authorName: auth.profile.displayName,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (campaign.beneficiaryId && campaign.beneficiaryId !== auth.user.uid) {
      await createNotification({
        userId: campaign.beneficiaryId,
        type: "campaign_update",
        title: "New campaign update",
        body: parsed.title,
        campaignId: id,
        href: `/campaigns/${campaign.slug}`,
      });
    }

    return jsonOk({ ok: true }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

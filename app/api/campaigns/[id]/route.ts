import { FieldValue } from "firebase-admin/firestore";
import { updateCampaignSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { canManageCampaign } from "@/lib/auth/roles";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";
import type { Campaign } from "@/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const parsed = updateCampaignSchema.parse(await request.json());
    const db = getAdminDb();
    const ref = db.collection("campaigns").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return jsonError("Campaign not found.", 404);

    const campaign = snap.data() as Campaign;
    if (!canManageCampaign(auth.profile.role, campaign.organizerId, auth.user.uid)) {
      return jsonError("You cannot edit this campaign.", 403);
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (parsed.title) updates.title = parsed.title;
    if (parsed.deceasedName) updates.deceasedName = parsed.deceasedName;
    if (parsed.location !== undefined) updates.location = parsed.location;
    if (parsed.description) updates.description = parsed.description;
    if (parsed.deceasedPhotoUrl !== undefined) updates.deceasedPhotoUrl = parsed.deceasedPhotoUrl;
    if (parsed.goalAmount !== undefined) updates.goalAmount = parsed.goalAmount;
    if (parsed.funeralDate) updates.funeralDate = new Date(parsed.funeralDate);
    if (parsed.status) {
      if (parsed.status === "active" && campaign.verificationStatus !== "verified") {
        return jsonError("Only a verified campaign can be set active by the organizer.", 400);
      }
      updates.status = parsed.status;
    }

    await ref.update(updates);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

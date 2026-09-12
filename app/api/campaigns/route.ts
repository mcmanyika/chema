import { FieldValue } from "firebase-admin/firestore";
import { createCampaignSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { elevateRole } from "@/lib/auth/roles";
import { handleRouteError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";
import { createNotification } from "@/lib/server/notifications";
import { slugify, uniqueSlug } from "@/utils/slug";
import type { Community, UserProfile } from "@/types";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const parsed = createCampaignSchema.parse(await request.json());
    const db = getAdminDb();
    const campaignRef = db.collection("campaigns").doc();
    const baseSlug = slugify(`${parsed.title}-${parsed.deceasedName}`) || slugify(parsed.title);
    let slug = uniqueSlug(baseSlug, campaignRef.id);

    const existing = await db.collection("campaigns").where("slug", "==", slug).limit(1).get();
    if (!existing.empty) {
      slug = uniqueSlug(baseSlug, `${campaignRef.id}x`);
    }

    let beneficiaryId = parsed.beneficiaryType === "self" ? auth.user.uid : parsed.beneficiaryId;
    let beneficiaryName = auth.profile.displayName;
    let stripeConnectedAccountId: string | undefined;

    if (beneficiaryId) {
      const beneficiarySnap = await db.collection("users").doc(beneficiaryId).get();
      if (!beneficiarySnap.exists) {
        beneficiaryId = auth.user.uid;
      } else {
        const beneficiary = beneficiarySnap.data() as UserProfile;
        beneficiaryName = beneficiary.displayName;
        stripeConnectedAccountId = beneficiary.stripeConnectedAccountId;
        await beneficiarySnap.ref.set(
          { role: elevateRole(beneficiary.role, "beneficiary") },
          { merge: true },
        );
        if (!beneficiary.stripeConnectedAccountId) {
          await createNotification({
            userId: beneficiaryId,
            type: "beneficiary_onboarding_required",
            title: "Connect payouts for a Chema",
            body: "A campaign named you as beneficiary. Connect Stripe Express in Settings to receive gifts.",
            href: "/settings",
          });
        }
      }
    }

    let communityName: string | undefined;
    if (parsed.communityId) {
      const communitySnap = await db.collection("communities").doc(parsed.communityId).get();
      if (communitySnap.exists) {
        communityName = (communitySnap.data() as Community).name;
      }
    }

    const funeralDate = parsed.funeralDate ? new Date(parsed.funeralDate) : null;

    await campaignRef.set({
      title: parsed.title,
      slug,
      deceasedName: parsed.deceasedName,
      deceasedPhotoUrl: parsed.deceasedPhotoUrl || "",
      description: parsed.description,
      organizerId: auth.user.uid,
      organizerName: auth.profile.displayName,
      organizerRelationship: parsed.organizerRelationship,
      beneficiaryId: beneficiaryId ?? auth.user.uid,
      beneficiaryName,
      communityId: parsed.communityId || "",
      communityName: communityName || "",
      goalAmount: parsed.goalAmount ?? null,
      amountRaised: 0,
      contributorCount: 0,
      currency: parsed.currency,
      status: "pending_verification",
      verificationStatus: "pending",
      stripeConnectedAccountId: stripeConnectedAccountId || "",
      location: parsed.location || "",
      funeralDate,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection("users").doc(auth.user.uid).set(
      { role: elevateRole(auth.profile.role, "campaign_creator") },
      { merge: true },
    );

    return jsonOk({ id: campaignRef.id, slug }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

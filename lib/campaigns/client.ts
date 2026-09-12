import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { createCampaignSchema, updateCampaignSchema, campaignUpdateSchema } from "@/lib/validations";
import { slugify, uniqueSlug } from "@/utils/slug";
import type { CreateCampaignInput } from "@/lib/validations";
import type { CampaignStatus, Community } from "@/types";

function requireUser() {
  const user = getClientAuth().currentUser;
  if (!user) {
    throw new Error("Please sign in to continue.");
  }
  return user;
}

export async function createCampaignClient(input: CreateCampaignInput) {
  const parsed = createCampaignSchema.parse(input);
  const user = requireUser();
  const db = getClientDb();
  const campaignRef = doc(collection(db, "campaigns"));
  const baseSlug = slugify(`${parsed.title}-${parsed.deceasedName}`) || slugify(parsed.title);
  const slug = uniqueSlug(baseSlug, campaignRef.id);

  const beneficiaryId =
    parsed.beneficiaryType === "member" && parsed.beneficiaryId
      ? parsed.beneficiaryId
      : user.uid;

  let communityName = "";
  if (parsed.communityId) {
    const communitySnap = await getDoc(doc(db, "communities", parsed.communityId));
    if (communitySnap.exists()) {
      communityName = (communitySnap.data() as Community).name;
    }
  }

  await setDoc(campaignRef, {
    title: parsed.title,
    slug,
    deceasedName: parsed.deceasedName,
    deceasedPhotoUrl: parsed.deceasedPhotoUrl || "",
    description: parsed.description,
    organizerId: user.uid,
    organizerName: user.displayName ?? user.email ?? "Member",
    organizerRelationship: parsed.organizerRelationship,
    beneficiaryId,
    beneficiaryName:
      beneficiaryId === user.uid ? (user.displayName ?? user.email ?? "Member") : "Member",
    communityId: parsed.communityId || "",
    communityName,
    goalAmount: parsed.goalAmount ?? null,
    amountRaised: 0,
    contributorCount: 0,
    currency: parsed.currency,
    status: "pending_verification",
    verificationStatus: "pending",
    stripeConnectedAccountId: "",
    location: parsed.location || "",
    funeralDate: parsed.funeralDate ? new Date(parsed.funeralDate) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: campaignRef.id, slug };
}

export async function updateCampaignClient(
  campaignId: string,
  input: {
    title?: string;
    description?: string;
    location?: string;
    goalAmount?: number | null;
    deceasedPhotoUrl?: string;
    status?: CampaignStatus;
  },
) {
  requireUser();
  const parsed = updateCampaignSchema.parse(input);
  const { updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(getClientDb(), "campaigns", campaignId), {
    ...parsed,
    updatedAt: serverTimestamp(),
  });
}

export async function setCampaignStatusClient(campaignId: string, status: CampaignStatus) {
  requireUser();
  const db = getClientDb();
  const campaignRef = doc(db, "campaigns", campaignId);
  const snap = await getDoc(campaignRef);
  if (!snap.exists()) {
    throw new Error("Campaign not found.");
  }

  const data = snap.data();
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  const becomingPublic = status === "active" && data.verificationStatus !== "verified";
  if (status === "active") {
    updates.verificationStatus = "verified";
  }

  await updateDoc(campaignRef, updates);

  if (becomingPublic && data.organizerId) {
    try {
      await addDoc(collection(db, "notifications"), {
        userId: data.organizerId as string,
        type: "campaign_verified",
        title: "Your Chema is verified",
        body: `${String(data.title ?? "Your Chema")} is now public and can receive gifts.`,
        campaignId,
        href: `/campaigns/${String(data.slug ?? campaignId)}`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Notification is optional if rules block it.
    }
  }
}

export async function verifyCampaignClient(campaignId: string) {
  requireUser();
  const db = getClientDb();
  const campaignRef = doc(db, "campaigns", campaignId);
  const snap = await getDoc(campaignRef);
  if (!snap.exists()) {
    throw new Error("Campaign not found.");
  }

  await updateDoc(campaignRef, {
    status: "active",
    verificationStatus: "verified",
    updatedAt: serverTimestamp(),
  });

  const organizerId = snap.data()?.organizerId as string | undefined;
  const slug = String(snap.data()?.slug ?? campaignId);
  const title = String(snap.data()?.title ?? "Your Chema");
  if (organizerId) {
    try {
      await addDoc(collection(db, "notifications"), {
        userId: organizerId,
        type: "campaign_verified",
        title: "Your Chema is verified",
        body: `${title} is now public and can receive gifts.`,
        campaignId,
        href: `/campaigns/${slug}`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Notification is optional if rules block it.
    }
  }
}

export async function postCampaignUpdateClient(
  campaignId: string,
  input: { title: string; body: string },
) {
  const user = requireUser();
  const parsed = campaignUpdateSchema.parse(input);
  const { addDoc, collection: subcollection } = await import("firebase/firestore");
  await addDoc(subcollection(getClientDb(), "campaigns", campaignId, "updates"), {
    title: parsed.title,
    body: parsed.body,
    authorId: user.uid,
    authorName: user.displayName ?? user.email ?? "Member",
    createdAt: serverTimestamp(),
  });
}

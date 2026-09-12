import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import type { Campaign, Community, UserProfile } from "@/types";

export function withId<T>(id: string, data: Omit<T, "id"> | T): T {
  return { ...(data as T), id };
}

export async function getUserProfile(
  db: Firestore,
  uid: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return withId<UserProfile>(snap.id, snap.data() as Omit<UserProfile, "id">);
}

export async function getCampaignBySlug(
  db: Firestore,
  slug: string,
): Promise<Campaign | null> {
  const snap = await getDocs(
    query(collection(db, "campaigns"), where("slug", "==", slug), limit(1)),
  );
  if (snap.empty) return null;
  const docSnap = snap.docs[0]!;
  return withId<Campaign>(docSnap.id, docSnap.data() as Omit<Campaign, "id">);
}

export async function getCampaignById(
  db: Firestore,
  id: string,
): Promise<Campaign | null> {
  const snap = await getDoc(doc(db, "campaigns", id));
  if (!snap.exists()) return null;
  return withId<Campaign>(snap.id, snap.data() as Omit<Campaign, "id">);
}

export function activeCampaignConstraints(): QueryConstraint[] {
  return [where("status", "==", "active"), orderBy("createdAt", "desc")];
}

export function userContributionConstraints(userId: string): QueryConstraint[] {
  return [where("userId", "==", userId), orderBy("createdAt", "desc")];
}

export function communityCampaignConstraints(communityId: string): QueryConstraint[] {
  return [where("communityId", "==", communityId), orderBy("createdAt", "desc")];
}

export async function listPublicCommunities(db: Firestore): Promise<Community[]> {
  const snap = await getDocs(
    query(
      collection(db, "communities"),
      where("privacy", "==", "public"),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((item) =>
    withId<Community>(item.id, item.data() as Omit<Community, "id">),
  );
}

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { createCommunitySchema } from "@/lib/validations";

function requireUser() {
  const user = getClientAuth().currentUser;
  if (!user) {
    throw new Error("Please sign in to continue.");
  }
  return user;
}

export async function syncOwnCommunityMembership(communityId: string) {
  const user = requireUser();
  await syncUserCommunity(user.uid, communityId, "add");
}

async function syncUserCommunity(uid: string, communityId: string, action: "add" | "remove") {
  try {
    await setDoc(
      doc(getClientDb(), "users", uid),
      {
        communityIds: action === "add" ? arrayUnion(communityId) : arrayRemove(communityId),
      },
      { merge: true },
    );
  } catch {
    // Membership is stored on the community; profile sync is best-effort.
  }
}

export async function createCommunityClient(input: {
  name: string;
  description: string;
  privacy: "public" | "private";
}) {
  const parsed = createCommunitySchema.parse(input);
  const user = requireUser();
  const db = getClientDb();
  const communityRef = doc(collection(db, "communities"));

  await setDoc(communityRef, {
    name: parsed.name,
    description: parsed.description,
    createdBy: user.uid,
    privacy: parsed.privacy,
    memberCount: 1,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(communityRef, "members", user.uid), {
    userId: user.uid,
    displayName: user.displayName ?? user.email ?? "Member",
    role: "admin",
    joinedAt: serverTimestamp(),
  });

  await syncUserCommunity(user.uid, communityRef.id, "add");
  return { id: communityRef.id };
}

export async function requestToJoinCommunityClient(communityId: string, displayName?: string) {
  const user = requireUser();
  const db = getClientDb();
  const communityRef = doc(db, "communities", communityId);

  await setDoc(doc(communityRef, "joinRequests", user.uid), {
    userId: user.uid,
    displayName: displayName ?? user.displayName ?? user.email ?? "Member",
    requestedAt: serverTimestamp(),
  });
}

export async function cancelJoinRequestClient(communityId: string) {
  const user = requireUser();
  await deleteDoc(doc(getClientDb(), "communities", communityId, "joinRequests", user.uid));
}

export async function acceptJoinRequestClient(
  communityId: string,
  request: { userId: string; displayName: string },
) {
  requireUser();
  const db = getClientDb();
  const communityRef = doc(db, "communities", communityId);

  await setDoc(doc(communityRef, "members", request.userId), {
    userId: request.userId,
    displayName: request.displayName,
    role: "member",
    joinedAt: serverTimestamp(),
  });
  await updateDoc(communityRef, { memberCount: increment(1) });
  await deleteDoc(doc(communityRef, "joinRequests", request.userId));
  await syncUserCommunity(request.userId, communityId, "add");
}

export async function denyJoinRequestClient(communityId: string, userId: string) {
  requireUser();
  await deleteDoc(doc(getClientDb(), "communities", communityId, "joinRequests", userId));
}

export async function removeMemberClient(communityId: string, userId: string) {
  requireUser();
  const db = getClientDb();
  const communityRef = doc(db, "communities", communityId);

  await deleteDoc(doc(communityRef, "members", userId));
  await updateDoc(communityRef, { memberCount: increment(-1) });
  await syncUserCommunity(userId, communityId, "remove");
}

export async function leaveCommunityClient(communityId: string) {
  const user = requireUser();
  const db = getClientDb();
  const communityRef = doc(db, "communities", communityId);

  await deleteDoc(doc(communityRef, "members", user.uid));
  await updateDoc(communityRef, { memberCount: increment(-1) });
  await syncUserCommunity(user.uid, communityId, "remove");
}

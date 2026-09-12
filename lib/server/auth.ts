import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, verifyIdToken } from "@/lib/firebase/admin";
import { jsonError } from "@/lib/api/http";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserProfile } from "@/types";

export async function requireUser(request: Request): Promise<
  | { user: DecodedIdToken; profile: UserProfile; error?: undefined }
  | { user?: undefined; profile?: undefined; error: ReturnType<typeof jsonError> }
> {
  const decoded = await verifyIdToken(request.headers.get("Authorization"));
  if (!decoded) {
    return { error: jsonError("Please sign in to continue.", 401) };
  }

  const ref = getAdminDb().collection("users").doc(decoded.uid);
  let snap = await ref.get();

  if (!snap.exists) {
    const names = (decoded.name ?? "").split(" ").filter(Boolean);
    await ref.set({
      uid: decoded.uid,
      email: decoded.email ?? "",
      firstName: names[0] ?? "",
      lastName: names.slice(1).join(" "),
      displayName: decoded.name ?? decoded.email ?? "Member",
      photoURL: decoded.picture ?? "",
      role: "member",
      createdAt: FieldValue.serverTimestamp(),
    });
    snap = await ref.get();
  }

  const profile = { uid: snap.id, ...(snap.data() as Omit<UserProfile, "uid">) };
  return { user: decoded, profile };
}

export function requireAdmin(profile: UserProfile) {
  if (!isAdminRole(profile.role)) {
    return jsonError("Admin access is required.", 403);
  }
  return null;
}

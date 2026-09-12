import { FieldValue } from "firebase-admin/firestore";
import { createCommunitySchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { elevateRole } from "@/lib/auth/roles";
import { handleRouteError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const parsed = createCommunitySchema.parse(await request.json());
    const db = getAdminDb();
    const ref = db.collection("communities").doc();

    await db.runTransaction(async (tx) => {
      tx.set(ref, {
        name: parsed.name,
        description: parsed.description,
        createdBy: auth.user.uid,
        privacy: parsed.privacy,
        memberCount: 1,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(ref.collection("members").doc(auth.user.uid), {
        userId: auth.user.uid,
        displayName: auth.profile.displayName,
        role: "admin",
        joinedAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        db.collection("users").doc(auth.user.uid),
        {
          role: elevateRole(auth.profile.role, "community_admin"),
          communityIds: FieldValue.arrayUnion(ref.id),
        },
        { merge: true },
      );
    });

    return jsonOk({ id: ref.id }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

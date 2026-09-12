import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const db = getAdminDb();
    const communityRef = db.collection("communities").doc(id);
    const memberRef = communityRef.collection("members").doc(auth.user.uid);

    await db.runTransaction(async (tx) => {
      const community = await tx.get(communityRef);
      if (!community.exists) throw new Error("Community not found.");
      const member = await tx.get(memberRef);
      if (!member.exists) return;
      tx.delete(memberRef);
      tx.update(communityRef, { memberCount: FieldValue.increment(-1) });
      tx.set(
        db.collection("users").doc(auth.user.uid),
        { communityIds: FieldValue.arrayRemove(id) },
        { merge: true },
      );
    });

    return jsonOk({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Community not found.") {
      return jsonError(error.message, 404);
    }
    return handleRouteError(error);
  }
}

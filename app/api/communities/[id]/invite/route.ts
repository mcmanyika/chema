import { inviteMemberSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";
import { createNotification } from "@/lib/server/notifications";
import type { Community } from "@/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const parsed = inviteMemberSchema.parse(await request.json());
    const db = getAdminDb();

    const memberSnap = await db
      .collection("communities")
      .doc(id)
      .collection("members")
      .doc(auth.user.uid)
      .get();
    if (!memberSnap.exists) {
      return jsonError("Join this community before inviting others.", 403);
    }

    const communitySnap = await db.collection("communities").doc(id).get();
    if (!communitySnap.exists) return jsonError("Community not found.", 404);
    const community = communitySnap.data() as Community;

    const users = await db.collection("users").where("email", "==", parsed.email).limit(1).get();
    if (users.empty) {
      return jsonError("No registered member uses that email yet.", 404);
    }

    const invitee = users.docs[0]!;
    await createNotification({
      userId: invitee.id,
      type: "community_invitation",
      title: `Invitation to ${community.name}`,
      body: `${auth.profile.displayName} invited you to join ${community.name}.`,
      communityId: id,
      href: `/communities/${id}`,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

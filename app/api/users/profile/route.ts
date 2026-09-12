import { profileSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase/admin";
import { handleRouteError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/server/auth";

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    const parsed = profileSchema.parse(await request.json());
    await getAdminDb()
      .collection("users")
      .doc(auth.user.uid)
      .set(
        {
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          displayName: parsed.displayName,
          photoURL: parsed.photoURL || auth.profile.photoURL || "",
        },
        { merge: true },
      );

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

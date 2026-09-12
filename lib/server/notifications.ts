import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { NotificationType } from "@/types";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  campaignId?: string;
  communityId?: string;
  href?: string;
}) {
  await getAdminDb().collection("notifications").add({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    campaignId: input.campaignId ?? null,
    communityId: input.communityId ?? null,
    href: input.href ?? "/dashboard",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

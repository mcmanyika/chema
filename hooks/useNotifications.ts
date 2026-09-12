"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { AppNotification, Campaign } from "@/types";

export function useNotifications(userId?: string | null) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(userId && configured);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!userId || !configured) return;

    return onSnapshot(
      query(
        collection(getClientDb(), "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setNotifications(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<AppNotification, "id">),
          })),
        );
        setLoading(false);
      },
    );
  }, [configured, userId]);

  const visible = enabled ? notifications : [];
  const unreadCount = visible.filter((item) => !item.read).length;

  async function markRead(id: string) {
    await updateDoc(doc(getClientDb(), "notifications", id), { read: true });
  }

  return { notifications: visible, loading: enabled ? loading : false, unreadCount, markRead };
}

export function useMyCampaigns(userId?: string | null) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(userId && configured);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!userId || !configured) return;

    return onSnapshot(
      query(
        collection(getClientDb(), "campaigns"),
        where("organizerId", "==", userId),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setCampaigns(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Campaign, "id">),
          })),
        );
        setLoading(false);
      },
    );
  }, [configured, userId]);

  return { campaigns: enabled ? campaigns : [], loading: enabled ? loading : false };
}

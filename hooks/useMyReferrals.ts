"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Referral } from "@/types";

export function useMyReferrals(userId?: string | null) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(userId && configured);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!userId || !configured) return;

    return onSnapshot(
      query(
        collection(getClientDb(), "referrals"),
        where("referrerId", "==", userId),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setReferrals(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Referral, "id">),
          })),
        );
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
  }, [configured, userId]);

  return {
    referrals: enabled ? referrals : [],
    loading: enabled ? loading : false,
    count: enabled ? referrals.length : 0,
  };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Contribution } from "@/types";

interface UseMyContributionsResult {
  contributions: Contribution[];
  loading: boolean;
  error: string | null;
  totalGiven: number;
  familiesSupported: number;
}

export function useMyContributions(userId?: string | null): UseMyContributionsResult {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(userId && configured);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !configured) return;

    const q = query(
      collection(getClientDb(), "contributions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(
      q,
      (snap) => {
        setContributions(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Contribution, "id">),
          })),
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [configured, userId]);

  const totals = useMemo(() => {
    const paid = contributions.filter((item) => item.status === "paid");
    const families = new Set(paid.map((item) => item.campaignId));
    return {
      totalGiven: paid.reduce((sum, item) => sum + item.amount, 0),
      familiesSupported: families.size,
    };
  }, [contributions]);

  return {
    contributions: enabled ? contributions : [],
    loading: enabled ? loading : false,
    error: enabled ? error : null,
    totalGiven: totals.totalGiven,
    familiesSupported: totals.familiesSupported,
  };
}

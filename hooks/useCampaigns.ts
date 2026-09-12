"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Campaign, CampaignUpdate, ChemaBookEntry } from "@/types";

export function useActiveCampaigns(max = 12) {
  const configured = isFirebaseConfigured();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;

    const q = query(
      collection(getClientDb(), "campaigns"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(max),
    );

    return onSnapshot(
      q,
      (snap) => {
        setCampaigns(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Campaign, "id">),
          })),
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [configured, max]);

  return { campaigns, loading, error };
}

export function useCampaign(slugOrId?: string) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(slugOrId && configured);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrId || !configured) return;

    const db = getClientDb();
    let unsubSlug: (() => void) | undefined;

    const unsubById = onSnapshot(
      doc(db, "campaigns", slugOrId),
      (snap) => {
        if (snap.exists()) {
          unsubSlug?.();
          unsubSlug = undefined;
          setCampaign({ id: snap.id, ...(snap.data() as Omit<Campaign, "id">) });
          setLoading(false);
          return;
        }

        if (unsubSlug) return;

        unsubSlug = onSnapshot(
          query(collection(db, "campaigns"), where("slug", "==", slugOrId), limit(1)),
          (slugSnap) => {
            if (slugSnap.empty) {
              setCampaign(null);
            } else {
              const item = slugSnap.docs[0]!;
              setCampaign({ id: item.id, ...(item.data() as Omit<Campaign, "id">) });
            }
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          },
        );
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsubById();
      unsubSlug?.();
    };
  }, [configured, slugOrId]);

  return { campaign, loading: enabled ? loading : false, error };
}

export function useChemaBook(campaignId?: string) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(campaignId && configured);
  const [entries, setEntries] = useState<ChemaBookEntry[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!campaignId || !configured) return;

    return onSnapshot(
      query(
        collection(getClientDb(), "campaigns", campaignId, "chemaBook"),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setEntries(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<ChemaBookEntry, "id">),
          })),
        );
        setLoading(false);
      },
    );
  }, [campaignId, configured]);

  return { entries: enabled ? entries : [], loading: enabled ? loading : false };
}

export function useCampaignUpdates(campaignId?: string) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(campaignId && configured);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!campaignId || !configured) return;

    return onSnapshot(
      query(
        collection(getClientDb(), "campaigns", campaignId, "updates"),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setUpdates(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<CampaignUpdate, "id">),
          })),
        );
        setLoading(false);
      },
    );
  }, [campaignId, configured]);

  return { updates: enabled ? updates : [], loading: enabled ? loading : false };
}

export function useContribution(contributionId?: string | null) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(contributionId && configured);
  const [contribution, setContribution] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!contributionId || !configured) return;

    return onSnapshot(
      doc(getClientDb(), "contributions", contributionId),
      (snap) => {
        setContribution(snap.exists() ? { status: String(snap.data()?.status ?? "") } : null);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
  }, [configured, contributionId]);

  return {
    contribution: enabled ? contribution : null,
    loading: enabled ? loading : false,
  };
}

export function useAdminCampaigns() {
  const configured = isFirebaseConfigured();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    return onSnapshot(
      query(collection(getClientDb(), "campaigns"), orderBy("createdAt", "desc")),
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
  }, [configured]);

  return { campaigns, loading };
}

export function usePendingCampaigns() {
  const configured = isFirebaseConfigured();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    return onSnapshot(
      query(
        collection(getClientDb(), "campaigns"),
        where("verificationStatus", "==", "pending"),
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
  }, [configured]);

  return { campaigns, loading };
}

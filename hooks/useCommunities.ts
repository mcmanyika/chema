"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Campaign, Community, CommunityJoinRequest, CommunityMember } from "@/types";

export function useCommunities() {
  const configured = isFirebaseConfigured();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    return onSnapshot(
      query(collection(getClientDb(), "communities"), orderBy("createdAt", "desc")),
      (snap) => {
        setCommunities(
          snap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Community, "id">),
          })),
        );
        setLoading(false);
      },
    );
  }, [configured]);

  return { communities, loading };
}

export function useCommunity(communityId?: string) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(communityId && configured);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!communityId || !configured) return;

    return onSnapshot(doc(getClientDb(), "communities", communityId), (snap) => {
      setCommunity(
        snap.exists()
          ? { id: snap.id, ...(snap.data() as Omit<Community, "id">) }
          : null,
      );
      setLoading(false);
    });
  }, [communityId, configured]);

  return { community, loading: enabled ? loading : false };
}

export function useCommunityMembership(communityId?: string, userId?: string | null) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(communityId && userId && configured);
  const [member, setMember] = useState<CommunityMember | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!communityId || !userId || !configured) return;

    return onSnapshot(
      doc(getClientDb(), "communities", communityId, "members", userId),
      (snap) => {
        setMember(snap.exists() ? (snap.data() as CommunityMember) : null);
        setLoading(false);
      },
    );
  }, [communityId, configured, userId]);

  return {
    isMember: enabled ? Boolean(member) : false,
    isCommunityAdmin: enabled ? member?.role === "admin" : false,
    loading: enabled ? loading : false,
  };
}

export function useMyJoinRequest(communityId?: string, userId?: string | null) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(communityId && userId && configured);
  const [hasRequest, setHasRequest] = useState(false);

  useEffect(() => {
    if (!communityId || !userId || !configured) return;

    return onSnapshot(
      doc(getClientDb(), "communities", communityId, "joinRequests", userId),
      (snap) => {
        setHasRequest(snap.exists());
      },
    );
  }, [communityId, configured, userId]);

  return { hasRequest: enabled ? hasRequest : false };
}

export function usePendingJoinRequests(communityId?: string, enabled = false) {
  const configured = isFirebaseConfigured();
  const active = Boolean(communityId && configured && enabled);
  const [requests, setRequests] = useState<CommunityJoinRequest[]>([]);

  useEffect(() => {
    if (!communityId || !configured || !enabled) {
      setRequests([]);
      return;
    }

    return onSnapshot(
      collection(getClientDb(), "communities", communityId, "joinRequests"),
      (snap) => {
        setRequests(snap.docs.map((item) => item.data() as CommunityJoinRequest));
      },
      () => {
        setRequests([]);
      },
    );
  }, [communityId, configured, enabled]);

  return { requests: active ? requests : [] };
}

export function useCommunityMembers(communityId?: string) {
  const configured = isFirebaseConfigured();
  const [members, setMembers] = useState<CommunityMember[]>([]);

  useEffect(() => {
    if (!communityId || !configured) return;

    return onSnapshot(
      collection(getClientDb(), "communities", communityId, "members"),
      (snap) => {
        setMembers(snap.docs.map((item) => item.data() as CommunityMember));
      },
      () => {
        setMembers([]);
      },
    );
  }, [communityId, configured]);

  return { members };
}

export function useCommunityCampaigns(communityId?: string) {
  const configured = isFirebaseConfigured();
  const enabled = Boolean(communityId && configured);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!communityId || !configured) return;

    return onSnapshot(
      query(
        collection(getClientDb(), "campaigns"),
        where("communityId", "==", communityId),
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
      () => {
        setCampaigns([]);
        setLoading(false);
      },
    );
  }, [communityId, configured]);

  return { campaigns: enabled ? campaigns : [], loading: enabled ? loading : false };
}

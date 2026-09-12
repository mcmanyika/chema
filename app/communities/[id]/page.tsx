"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampaignGrid } from "@/components/campaigns/CampaignGrid";
import { GiveChemaModal } from "@/components/payments/GiveChemaModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCommunity,
  useCommunityCampaigns,
  useCommunityMembers,
  useCommunityMembership,
  useMyJoinRequest,
  usePendingJoinRequests,
} from "@/hooks/useCommunities";
import {
  acceptJoinRequestClient,
  cancelJoinRequestClient,
  denyJoinRequestClient,
  leaveCommunityClient,
  removeMemberClient,
  requestToJoinCommunityClient,
  syncOwnCommunityMembership,
} from "@/lib/communities/client";
import { apiFetch } from "@/lib/api";
import type { Campaign, CommunityJoinRequest } from "@/types";

function CommunityInner() {
  const params = useParams<{ id: string }>();
  const { community, loading } = useCommunity(params.id);
  const { campaigns } = useCommunityCampaigns(params.id);
  const { members } = useCommunityMembers(params.id);
  const router = useRouter();
  const { firebaseUser, profile } = useAuth();
  const userId = firebaseUser?.uid ?? profile?.uid;
  const { isMember, isCommunityAdmin } = useCommunityMembership(params.id, userId);
  const canManage = Boolean(
    userId && community && (community.createdBy === userId || isCommunityAdmin),
  );
  const { hasRequest } = useMyJoinRequest(params.id, userId);
  const { requests } = usePendingJoinRequests(params.id, canManage);
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isMember || !params.id || !firebaseUser) return;
    void syncOwnCommunityMembership(params.id);
  }, [firebaseUser, isMember, params.id]);

  if (loading) return <LoadingState />;
  if (!community) return <p className="px-4 py-16 text-center">Community not found.</p>;

  async function requestJoin() {
    if (!firebaseUser) {
      router.push(`/login?next=/communities/${params.id}`);
      return;
    }
    try {
      await requestToJoinCommunityClient(params.id, profile?.displayName);
      toast.success("Your request was sent to the community creator.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request to join.");
    }
  }

  async function cancelRequest() {
    try {
      await cancelJoinRequestClient(params.id);
      toast.success("Join request cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel request.");
    }
  }

  async function leave() {
    try {
      await leaveCommunityClient(params.id);
      toast.success("You left this community.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to leave.");
    }
  }

  async function accept(request: CommunityJoinRequest) {
    setBusyId(request.userId);
    try {
      await acceptJoinRequestClient(params.id, request);
      toast.success(`${request.displayName} was accepted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept this request.");
    } finally {
      setBusyId(null);
    }
  }

  async function deny(request: CommunityJoinRequest) {
    setBusyId(request.userId);
    try {
      await denyJoinRequestClient(params.id, request.userId);
      toast.success(`${request.displayName} was denied.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to deny this request.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(userIdToRemove: string, displayName: string) {
    setBusyId(userIdToRemove);
    try {
      await removeMemberClient(params.id, userIdToRemove);
      toast.success(`${displayName} was removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this member.");
    } finally {
      setBusyId(null);
    }
  }

  async function invite() {
    try {
      await apiFetch(`/api/communities/${params.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success("Invitation sent.");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to invite.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{community.privacy} community</p>
      <h1 className="mt-2 font-serif text-4xl">{community.name}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{community.description}</p>
      <p className="mt-4 text-sm text-forest">
        {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {isMember ? (
          <Button variant="secondary" onClick={() => void leave()}>
            Leave community
          </Button>
        ) : hasRequest ? (
          <Button variant="secondary" onClick={() => void cancelRequest()}>
            Cancel join request
          </Button>
        ) : (
          <Button onClick={() => void requestJoin()}>Request to join</Button>
        )}
        <Button href="/campaigns/create" variant="secondary">
          Start a Chema here
        </Button>
      </div>
      {!isMember && hasRequest ? (
        <p className="mt-3 text-sm text-ink-muted">
          Your request is waiting for the community creator to accept or deny it.
        </p>
      ) : null}

      {canManage ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Pending requests</h2>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No one is waiting to join right now.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
              {requests.map((request) => (
                <li
                  key={request.userId}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm">{request.displayName}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === request.userId}
                      onClick={() => void accept(request)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyId === request.userId}
                      onClick={() => void deny(request)}
                    >
                      Deny
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {isMember ? (
        <form
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void invite();
          }}
        >
          <Input
            type="email"
            placeholder="Invite a registered member by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit">Invite</Button>
        </form>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Community campaigns</h2>
        <div className="mt-4">
          {campaigns.length === 0 ? (
            <EmptyState title="No campaigns in this community yet" />
          ) : (
            <CampaignGrid campaigns={campaigns} onGive={setSelected} />
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Members</h2>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex justify-between gap-3 sm:block">
                <span>{member.displayName}</span>
                <span className="text-ink-muted">{member.role}</span>
              </div>
              {canManage && member.userId !== userId && member.userId !== community.createdBy ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === member.userId}
                  onClick={() => void removeMember(member.userId, member.displayName)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <GiveChemaModal campaign={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function CommunityDetailPage() {
  return <CommunityInner />;
}

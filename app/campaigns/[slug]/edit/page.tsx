"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { CampaignStatusSelect } from "@/components/campaigns/CampaignStatusSelect";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaign } from "@/hooks/useCampaigns";
import { postCampaignUpdateClient, updateCampaignClient } from "@/lib/campaigns/client";
import { canManageCampaign, isAdminRole } from "@/lib/auth/roles";
import type { Campaign } from "@/types";
import { centsToDollars, dollarsToCents } from "@/utils/format";

function EditForm({ campaign, isAdmin }: { campaign: Campaign; isAdmin: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description);
  const [location, setLocation] = useState(campaign.location ?? "");
  const [goal, setGoal] = useState(
    campaign.goalAmount ? String(centsToDollars(campaign.goalAmount)) : "",
  );
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateCampaignClient(campaign.id, {
        title,
        description,
        location,
        goalAmount: goal ? dollarsToCents(Number(goal)) : null,
      });
      toast.success("Campaign updated.");
      router.push(`/campaigns/${campaign.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "paused" | "closed" | "active") {
    await updateCampaignClient(campaign.id, { status });
    toast.success(`Campaign ${status}.`);
  }

  async function postUpdate() {
    await postCampaignUpdateClient(campaign.id, { title: updateTitle, body: updateBody });
    setUpdateTitle("");
    setUpdateBody("");
    toast.success("Update posted.");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-4xl">Edit campaign</h1>
      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="goal">Optional hoped-for amount</Label>
          <Input id="goal" type="number" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="description">Story</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button onClick={save} disabled={busy}>
          Save changes
        </Button>
        {isAdmin ? (
          <div className="pt-4">
            <Label htmlFor="status">Campaign status</Label>
            <CampaignStatusSelect id="status" campaign={campaign} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="secondary" onClick={() => void setStatus("paused")}>
              Pause
            </Button>
            <Button variant="secondary" onClick={() => void setStatus("closed")}>
              Close
            </Button>
          </div>
        )}
      </div>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-serif text-2xl">Post an update</h2>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="Update title"
            value={updateTitle}
            onChange={(e) => setUpdateTitle(e.target.value)}
          />
          <Textarea
            placeholder="Share funeral or family news"
            value={updateBody}
            onChange={(e) => setUpdateBody(e.target.value)}
          />
          <Button variant="secondary" onClick={() => void postUpdate()}>
            Publish update
          </Button>
        </div>
      </section>
    </div>
  );
}

function EditInner() {
  const params = useParams<{ slug: string }>();
  const { campaign, loading } = useCampaign(params.slug);
  const { profile } = useAuth();

  if (loading) return <LoadingState />;
  if (!campaign) return <p className="px-4 py-16 text-center">Campaign not found.</p>;
  if (!canManageCampaign(profile?.role, campaign.organizerId, profile?.uid)) {
    return <p className="px-4 py-16 text-center">You cannot edit this campaign.</p>;
  }

  return (
    <EditForm
      key={campaign.id}
      campaign={campaign}
      isAdmin={isAdminRole(profile?.role)}
    />
  );
}

export default function EditCampaignPage() {
  return (
    <ProtectedRoute>
      <EditInner />
    </ProtectedRoute>
  );
}

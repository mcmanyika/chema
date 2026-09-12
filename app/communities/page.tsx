"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CommunityCard } from "@/components/communities/CommunityCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunities } from "@/hooks/useCommunities";
import { createCommunityClient } from "@/lib/communities/client";

function CommunitiesInner() {
  const { communities, loading } = useCommunities();
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");

  async function createCommunity() {
    if (name.trim().length < 2) {
      toast.error("Please enter a community name.");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Add a short description of this community.");
      return;
    }
    try {
      await createCommunityClient({ name, description, privacy });
      toast.success("Community created.");
      setOpen(false);
      setName("");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create community.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-4xl">Communities</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Gather your church, hometown, alumni, or family circle.
          </p>
        </div>
        {firebaseUser ? (
          <Button onClick={() => setOpen(true)}>Create a community</Button>
        ) : null}
      </div>
      <div className="mt-8">
        {loading ? (
          <LoadingState />
        ) : communities.length === 0 ? (
          <EmptyState
            title="No communities yet"
            description="Create the first circle so families know where to gather."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {communities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create a community">
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="privacy">Privacy</Label>
            <Select
              id="privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as "public" | "private")}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
            <p className="mt-2 text-xs text-ink-muted">
              People who ask to join will wait until you accept or deny them.
            </p>
          </div>
          <Button className="w-full" onClick={() => void createCommunity()}>
            Create
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function CommunitiesPage() {
  return <CommunitiesInner />;
}

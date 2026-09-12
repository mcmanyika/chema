"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunities } from "@/hooks/useCommunities";
import { createCampaignClient } from "@/lib/campaigns/client";
import { RELATIONSHIP_OPTIONS } from "@/lib/constants";
import { getClientStorage } from "@/lib/firebase/client";
import { dollarsToCents } from "@/utils/format";

const steps = ["Details", "Story", "Beneficiary", "Community", "Review"];

function CreateCampaignInner() {
  const router = useRouter();
  const { firebaseUser, profile } = useAuth();
  const { communities } = useCommunities();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    deceasedName: "",
    title: "",
    organizerRelationship: "",
    location: "",
    funeralDate: "",
    description: "",
    beneficiaryType: "self" as "self" | "member",
    beneficiaryId: "",
    communityId: "",
    goalAmount: "",
  });

  const previewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : ""),
    [photoFile],
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep(): boolean {
    if (step === 0) {
      return Boolean(form.deceasedName && form.title && form.organizerRelationship);
    }
    if (step === 1) return form.description.trim().length >= 20;
    if (step === 2) {
      return form.beneficiaryType === "self" || Boolean(form.beneficiaryId);
    }
    return true;
  }

  async function submit() {
    const uid = firebaseUser?.uid ?? profile?.uid;
    if (!uid) {
      toast.error("Please sign in to continue.");
      return;
    }
    setBusy(true);
    try {
      let deceasedPhotoUrl = "";
      if (photoFile) {
        try {
          const storageRef = ref(
            getClientStorage(),
            `uploads/${uid}/${Date.now()}-${photoFile.name}`,
          );
          await uploadBytes(storageRef, photoFile);
          deceasedPhotoUrl = await getDownloadURL(storageRef);
        } catch {
          toast.error("Photo could not be uploaded. The campaign will be created without it.");
        }
      }

      const result = await createCampaignClient({
        title: form.title,
        deceasedName: form.deceasedName,
        organizerRelationship: form.organizerRelationship,
        location: form.location || undefined,
        funeralDate: form.funeralDate || undefined,
        description: form.description,
        deceasedPhotoUrl: deceasedPhotoUrl || undefined,
        beneficiaryType: form.beneficiaryType,
        beneficiaryId: form.beneficiaryType === "member" ? form.beneficiaryId : undefined,
        communityId: form.communityId || undefined,
        goalAmount: form.goalAmount ? dollarsToCents(Number(form.goalAmount)) : undefined,
        currency: "USD",
      });

      toast.success("Your Chema was submitted for verification.");
      router.push(`/campaigns/${result.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create this campaign.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-4xl text-ink">Start a Chema</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Step {step + 1} of {steps.length}: {steps[step]}
      </p>
      <div className="mt-6 flex gap-2">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-forest" : "bg-line"}`}
          />
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {step === 0 ? (
          <>
            <div>
              <Label htmlFor="deceasedName">Deceased person’s name</Label>
              <Input
                id="deceasedName"
                value={form.deceasedName}
                onChange={(e) => update("deceasedName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="title">Campaign title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="In memory of Tendai Moyo"
              />
            </div>
            <div>
              <Label htmlFor="relationship">Your relationship</Label>
              <Select
                id="relationship"
                value={form.organizerRelationship}
                onChange={(e) => update("organizerRelationship", e.target.value)}
              >
                <option value="">Select</option>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Harare, Zimbabwe"
              />
            </div>
            <div>
              <Label htmlFor="funeralDate">Funeral date</Label>
              <Input
                id="funeralDate"
                type="date"
                value={form.funeralDate}
                onChange={(e) => update("funeralDate", e.target.value)}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <Label htmlFor="description">The story</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Share who they were, and how the community can stand with the family."
              />
            </div>
            <div>
              <Label htmlFor="photo">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="mt-3 h-40 w-full rounded-2xl object-cover" />
              ) : null}
            </div>
            <div>
              <Label htmlFor="goal">Optional hoped-for amount (USD)</Label>
              <Input
                id="goal"
                type="number"
                min="0"
                value={form.goalAmount}
                onChange={(e) => update("goalAmount", e.target.value)}
              />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.beneficiaryType === "self"}
                onChange={() => update("beneficiaryType", "self")}
              />
              I am the beneficiary
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.beneficiaryType === "member"}
                onChange={() => update("beneficiaryType", "member")}
              />
              Another registered member
            </label>
            {form.beneficiaryType === "member" ? (
              <div>
                <Label htmlFor="beneficiaryId">Beneficiary user ID</Label>
                <Input
                  id="beneficiaryId"
                  value={form.beneficiaryId}
                  onChange={(e) => update("beneficiaryId", e.target.value)}
                  placeholder="Ask the member for their Chema user ID from Profile"
                />
              </div>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <div>
            <Label htmlFor="community">Optional community</Label>
            <Select
              id="community"
              value={form.communityId}
              onChange={(e) => update("communityId", e.target.value)}
            >
              <option value="">No community</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3 rounded-2xl border border-line bg-card p-5 text-sm leading-7">
            <p><strong>Title:</strong> {form.title}</p>
            <p><strong>In memory of:</strong> {form.deceasedName}</p>
            <p><strong>Relationship:</strong> {form.organizerRelationship}</p>
            <p><strong>Location:</strong> {form.location || "—"}</p>
            <p><strong>Funeral:</strong> {form.funeralDate || "—"}</p>
            <p><strong>Beneficiary:</strong> {form.beneficiaryType === "self" ? "You" : form.beneficiaryId}</p>
            <p>{form.description}</p>
            <p className="text-ink-muted">
              This Chema will be submitted for verification before it becomes public.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button
            onClick={() => {
              if (!validateStep()) {
                toast.error("Please complete this step before continuing.");
                return;
              }
              setStep((value) => value + 1);
            }}
          >
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit for verification"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute>
      <CreateCampaignInner />
    </ProtectedRoute>
  );
}

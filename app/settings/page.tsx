"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import type { UserProfile } from "@/types";

const statusCopy = {
  not_connected: "Not connected",
  onboarding_incomplete: "Onboarding incomplete",
  verified: "Verified",
  payouts_enabled: "Payouts enabled",
};

function SettingsForm({ profile }: { profile: UserProfile }) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [country, setCountry] = useState("US");
  const connectStatus = profile.stripeConnectStatus ?? "not_connected";

  async function saveProfile() {
    try {
      await apiFetch("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`.trim(),
        }),
      });
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile.");
    }
  }

  async function startConnect() {
    try {
      await apiFetch("/api/stripe/connect/create-account", {
        method: "POST",
        body: JSON.stringify({ country }),
      });
      const link = await apiFetch<{ url: string }>("/api/stripe/connect/account-link", {
        method: "POST",
      });
      window.location.assign(link.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start Stripe Connect.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-4xl">Settings</h1>

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">Profile</h2>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Button onClick={() => void saveProfile()}>Save profile</Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">Beneficiary payouts</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Connect a Stripe Express account to receive Chema for a family. Bank details stay with
          Stripe and are never stored in Chema.
        </p>
        <p className="mt-4 text-sm">
          Status:{" "}
          <span className="font-medium text-forest">{statusCopy[connectStatus]}</span>
        </p>
        <div className="mt-4">
          <Label htmlFor="country">Country</Label>
          <Select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="ZA">South Africa</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </Select>
        </div>
        <Button className="mt-4" variant="secondary" onClick={() => void startConnect()}>
          {connectStatus === "not_connected" ? "Connect with Stripe" : "Continue onboarding"}
        </Button>
      </section>
    </div>
  );
}

function SettingsInner() {
  const { profile } = useAuth();
  if (!profile) return <LoadingState />;
  return <SettingsForm key={profile.uid} profile={profile} />;
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsInner />
    </ProtectedRoute>
  );
}

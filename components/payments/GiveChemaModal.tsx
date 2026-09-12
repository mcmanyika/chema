"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Check, Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useContribution } from "@/hooks/useCampaigns";
import { apiFetch } from "@/lib/api";
import { getStripePromise } from "@/lib/stripe/client";
import { PRESET_GIVE_AMOUNTS, PRESET_PLATFORM_SUPPORT } from "@/types";
import type { Campaign } from "@/types";
import { dollarsToCents, formatMoney } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/utils/cn";

interface GiveChemaModalProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
}

type Phase = "form" | "pay" | "confirming" | "success" | "failed";

export function GiveChemaModal({ campaign, open, onClose }: GiveChemaModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Give Chema">
      {campaign ? <GiveChemaFlow campaign={campaign} onClose={onClose} /> : null}
    </Modal>
  );
}

function GiveChemaFlow({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [phase, setPhase] = useState<Phase>("form");
  const [preset, setPreset] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState("25");
  const [support, setSupport] = useState(2);
  const [customSupport, setCustomSupport] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [contributionId, setContributionId] = useState<string | null>(null);

  const familyDollars = preset === "custom" ? Number(customAmount) || 0 : preset;
  const supportDollars = customSupport ? Number(customSupport) || 0 : support;
  const familyCents = dollarsToCents(familyDollars);
  const supportCents = dollarsToCents(supportDollars);
  const totalCents = familyCents + supportCents;

  async function startPayment() {
    if (!firebaseUser) {
      router.push(`/login?next=/campaigns/${campaign.slug}`);
      return;
    }
    if (familyCents < 100) {
      toast.error("Please give at least $1.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<{
        clientSecret: string;
        contributionId: string;
      }>("/api/stripe/create-payment-intent", {
        method: "POST",
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: familyCents,
          platformSupportAmount: supportCents,
          anonymous,
          message: message.trim() || undefined,
        }),
      });
      setClientSecret(result.clientSecret);
      setContributionId(result.contributionId);
      setPhase("pay");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start payment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "success") {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
          <Check className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-serif text-2xl text-ink">✓ Chema received</h3>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Thank you for standing with the family.
        </p>
        <Button className="mt-6" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="py-6 text-center">
        <h3 className="font-serif text-2xl text-ink">Payment was not completed.</h3>
        <p className="mt-2 text-sm text-ink-muted">Please try again.</p>
        <Button className="mt-6" onClick={() => setPhase("form")}>
          Try again
        </Button>
      </div>
    );
  }

  if ((phase === "pay" || phase === "confirming") && clientSecret) {
    return (
      <Elements
        stripe={getStripePromise()}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#2C4A3E",
              borderRadius: "12px",
            },
          },
        }}
      >
        <CheckoutForm
          confirming={phase === "confirming"}
          contributionId={contributionId}
          onConfirming={() => setPhase("confirming")}
          onSuccess={() => setPhase("success")}
          onFailed={() => setPhase("failed")}
        />
      </Elements>
    );
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">
        In memory of <span className="font-medium text-ink">{campaign.deceasedName}</span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {PRESET_GIVE_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setPreset(amount)}
            className={cn(
              "rounded-xl border px-3 py-3 text-sm font-medium",
              preset === amount
                ? "border-forest bg-forest/5 text-forest"
                : "border-line bg-white text-ink",
            )}
          >
            ${amount}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreset("custom")}
          className={cn(
            "col-span-2 rounded-xl border px-3 py-3 text-sm font-medium",
            preset === "custom"
              ? "border-forest bg-forest/5 text-forest"
              : "border-line bg-white text-ink",
          )}
        >
          Custom amount
        </button>
      </div>

      {preset === "custom" ? (
        <div className="mt-3">
          <Label htmlFor="custom-amount">Amount (USD)</Label>
          <Input
            id="custom-amount"
            type="number"
            min="1"
            step="1"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <Label htmlFor="message">Optional message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tiri pamwe chete nemi panguva ino."
          maxLength={500}
        />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(event) => setAnonymous(event.target.checked)}
          className="h-4 w-4 rounded border-line"
        />
        Give anonymously
      </label>

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-ink">Optional support for the Chema platform</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_PLATFORM_SUPPORT.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSupport(amount);
                setCustomSupport("");
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                support === amount && !customSupport
                  ? "border-forest bg-forest/5 text-forest"
                  : "border-line bg-white",
              )}
            >
              {amount === 0 ? "No extra" : `$${amount}`}
            </button>
          ))}
        </div>
        <Input
          className="mt-2"
          type="number"
          min="0"
          placeholder="Custom support amount"
          value={customSupport}
          onChange={(event) => setCustomSupport(event.target.value)}
        />
      </div>

      <div className="mt-6 space-y-1 rounded-2xl bg-cream px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span>Chema for family</span>
          <span>{formatMoney(familyCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Support Chema platform</span>
          <span>{formatMoney(supportCents)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 font-medium">
          <span>Total charged</span>
          <span>{formatMoney(totalCents)}</span>
        </div>
      </div>

      <Button className="mt-5 w-full" onClick={startPayment} disabled={submitting}>
        <Heart className="h-4 w-4" />
        {submitting ? "Preparing…" : "Continue to give"}
      </Button>
      <p className="mt-3 text-center text-xs text-ink-muted">
        The family receives the full Chema amount. Platform support is optional and separate.
      </p>
    </div>
  );
}

function CheckoutForm({
  contributionId,
  confirming,
  onConfirming,
  onSuccess,
  onFailed,
}: {
  contributionId: string | null;
  confirming: boolean;
  onConfirming: () => void;
  onSuccess: () => void;
  onFailed: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const { contribution } = useContribution(contributionId);

  useEffect(() => {
    if (contribution?.status === "paid") onSuccess();
    if (contribution?.status === "failed") onFailed();
  }, [contribution?.status, onFailed, onSuccess]);

  if (confirming) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-forest" />
        <p className="mt-4 font-serif text-2xl text-ink">Confirming your Chema...</p>
        <p className="mt-2 text-sm text-ink-muted">
          Waiting for confirmation. This updates automatically.
        </p>
      </div>
    );
  }

  async function confirm() {
    if (!stripe || !elements) return;
    setBusy(true);
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      toast.error(result.error.message ?? "Payment was not completed.");
      onFailed();
      setBusy(false);
      return;
    }

    onConfirming();
    setBusy(false);
  }

  return (
    <div>
      <PaymentElement />
      <Button className="mt-5 w-full" onClick={confirm} disabled={!stripe || busy}>
        {busy ? "Processing…" : "Give Chema"}
      </Button>
      <p className="mt-3 text-center text-xs text-ink-muted">
        Card details are handled by Stripe. Chema never stores your card number.
      </p>
    </div>
  );
}

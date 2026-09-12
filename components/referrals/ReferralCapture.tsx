"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { storeReferralCode } from "@/lib/referrals/client";

function ReferralCaptureInner() {
  const params = useSearchParams();
  const ref = params.get("ref");

  useEffect(() => {
    if (ref) storeReferralCode(ref);
  }, [ref]);

  return null;
}

export function ReferralCapture() {
  return (
    <Suspense>
      <ReferralCaptureInner />
    </Suspense>
  );
}

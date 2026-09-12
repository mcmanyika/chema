"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReferralCapture } from "@/components/referrals/ReferralCapture";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReferralCapture />
      {children}
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

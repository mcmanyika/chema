"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth/roles";
import { LoadingState } from "@/components/ui/LoadingState";
import type { UserRole } from "@/types";

export function ProtectedRoute({
  children,
  roles,
  adminOnly,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
  adminOnly?: boolean;
}) {
  const { firebaseUser, profile, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!configured) return;
    if (!firebaseUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [configured, firebaseUser, loading, pathname, router]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl">Chema is not configured yet</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Add Firebase and Stripe environment variables to start using this page.
        </p>
      </div>
    );
  }

  if (loading || !firebaseUser) {
    return <LoadingState label="Checking your session…" />;
  }

  if (adminOnly && !isAdminRole(profile?.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl">This area is reserved</h1>
        <p className="mt-3 text-sm text-ink-muted">
          You need a community or platform admin role to continue.
        </p>
      </div>
    );
  }

  if (roles && profile && !roles.includes(profile.role) && !isAdminRole(profile.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl">You do not have access</h1>
      </div>
    );
  }

  return <>{children}</>;
}

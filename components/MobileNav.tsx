"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { firebaseUser, profile, signOut } = useAuth();
  const signedIn = Boolean(firebaseUser);

  if (!open) return null;

  const items = [
    { href: "/", label: "Home" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/campaigns/create", label: "Start a Chema" },
    { href: "/communities", label: "Communities" },
    ...(signedIn ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(signedIn ? [{ href: "/referrals", label: "Referrals" }] : []),
    ...(signedIn ? [{ href: "/profile", label: "Profile" }] : []),
    ...(signedIn ? [{ href: "/settings", label: "Settings" }] : []),
    ...(isAdminRole(profile?.role) ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button className="absolute inset-0 bg-ink/40" onClick={onClose} aria-label="Close menu" />
      <aside className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <Link href="/" onClick={onClose} aria-label="Chema home" className="text-forest">
            <Logo className="h-9 w-9" />
          </Link>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-8 flex flex-col gap-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className="text-lg text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <Button href="/campaigns" className="w-full" onClick={onClose}>
            Give Chema
          </Button>
          {signedIn ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                void signOut();
                onClose();
              }}
            >
              Sign out
            </Button>
          ) : (
            <Button href="/login" variant="secondary" className="w-full" onClick={onClose}>
              Sign in
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

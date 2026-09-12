"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MobileNav } from "@/components/MobileNav";
import { cn } from "@/utils/cn";

const links = [
  { href: "/campaigns", label: "Campaigns" },
  { href: "/communities", label: "Communities" },
];

export function Navbar() {
  const pathname = usePathname();
  const { firebaseUser, profile, loading } = useAuth();
  const signedIn = Boolean(firebaseUser);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link href="/" aria-label="Chema home" className="shrink-0 text-forest">
          <Logo className="h-9 w-9" />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm",
                pathname.startsWith(link.href) ? "text-forest" : "text-ink-muted hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
          {signedIn ? (
            <Link
              href="/referrals"
              className={cn(
                "text-sm",
                pathname.startsWith("/referrals") ? "text-forest" : "text-ink-muted hover:text-ink",
              )}
            >
              Referrals
            </Link>
          ) : null}
          {signedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                "text-sm",
                pathname.startsWith("/dashboard") ? "text-forest" : "text-ink-muted hover:text-ink",
              )}
            >
              Dashboard
            </Link>
          ) : null}
          {isAdminRole(profile?.role) ? (
            <Link
              href="/admin"
              className={cn(
                "text-sm",
                pathname.startsWith("/admin") ? "text-forest" : "text-ink-muted hover:text-ink",
              )}
            >
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <Button href="/campaigns" size="sm" className="hidden sm:inline-flex">
            Give Chema
          </Button>
          {!loading && !signedIn ? (
            <Button href="/login" size="sm" variant="secondary" className="hidden sm:inline-flex">
              Sign in
            </Button>
          ) : null}
          {signedIn ? (
            <Link
              href="/profile"
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-forest text-sm text-white md:flex"
            >
              {(profile?.displayName ?? firebaseUser?.email ?? "M").slice(0, 1).toUpperCase()}
            </Link>
          ) : null}
          <button
            type="button"
            className="rounded-full p-2 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

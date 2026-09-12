"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/utils/format";

export function NotificationBell() {
  const { profile } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications(profile?.uid);
  const [open, setOpen] = useState(false);

  if (!profile) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 text-ink hover:bg-cream-dark"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-earth" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-card shadow-lg">
          <div className="border-b border-line px-4 py-3">
            <p className="font-medium text-ink">Notifications</p>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-sm text-ink-muted">You are all caught up.</li>
            ) : (
              notifications.slice(0, 8).map((item) => (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={item.href ?? "/dashboard"}
                    onClick={() => {
                      if (!item.read) void markRead(item.id);
                      setOpen(false);
                    }}
                    className="block px-4 py-3 hover:bg-cream"
                  >
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-muted">{item.body}</p>
                    <p className="mt-1 text-xs text-ink-muted">{formatRelativeTime(item.createdAt)}</p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

import { ADMIN_ROLES } from "@/lib/constants";
import type { UserRole } from "@/types";

export function isAdminRole(role?: UserRole | null): boolean {
  return Boolean(role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]));
}

export function canManageCampaign(
  role: UserRole | undefined,
  organizerId: string,
  userId?: string | null,
): boolean {
  if (!userId) return false;
  return organizerId === userId || isAdminRole(role);
}

export function elevateRole(current: UserRole, next: UserRole): UserRole {
  const rank: Record<UserRole, number> = {
    member: 0,
    campaign_creator: 1,
    beneficiary: 1,
    community_admin: 2,
    platform_admin: 3,
  };

  if (current === "platform_admin" || current === "community_admin") {
    return current;
  }

  return rank[next] > rank[current] ? next : current;
}

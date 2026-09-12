import type { Timestamp } from "firebase/firestore";

export type UserRole =
  | "member"
  | "campaign_creator"
  | "beneficiary"
  | "community_admin"
  | "platform_admin";

export type CampaignStatus =
  | "draft"
  | "pending_verification"
  | "active"
  | "paused"
  | "closed";

export type VerificationStatus = "unverified" | "pending" | "verified";

export type ContributionStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CommunityPrivacy = "public" | "private";

export type StripeConnectStatus =
  | "not_connected"
  | "onboarding_incomplete"
  | "verified"
  | "payouts_enabled";

export type NotificationType =
  | "payment_received"
  | "campaign_verified"
  | "campaign_update"
  | "beneficiary_onboarding_required"
  | "community_invitation";

export type FirestoreDate = Timestamp | Date | { seconds: number; nanoseconds: number };

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: FirestoreDate;
  stripeConnectedAccountId?: string;
  stripeConnectStatus?: StripeConnectStatus;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeDetailsSubmitted?: boolean;
  communityIds?: string[];
  referredBy?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  displayName: string;
  createdAt: FirestoreDate;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  privacy: CommunityPrivacy;
  memberCount: number;
  createdAt: FirestoreDate;
}

export interface CommunityMember {
  userId: string;
  displayName: string;
  role: "member" | "admin";
  joinedAt: FirestoreDate;
}

export interface CommunityJoinRequest {
  userId: string;
  displayName: string;
  requestedAt: FirestoreDate;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  deceasedName: string;
  deceasedPhotoUrl?: string;
  description: string;
  organizerId: string;
  organizerName?: string;
  organizerRelationship?: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  communityId?: string;
  communityName?: string;
  goalAmount?: number;
  amountRaised: number;
  contributorCount: number;
  currency: string;
  status: CampaignStatus;
  verificationStatus: VerificationStatus;
  stripeConnectedAccountId?: string;
  location?: string;
  funeralDate?: FirestoreDate;
  closesAt?: FirestoreDate;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface Contribution {
  id: string;
  userId: string;
  campaignId: string;
  campaignTitle?: string;
  deceasedName?: string;
  amount: number;
  currency: string;
  anonymous: boolean;
  message?: string;
  status: ContributionStatus;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  createdAt: FirestoreDate;
  paidAt?: FirestoreDate;
}

export interface Payment {
  id: string;
  userId: string;
  campaignId: string;
  contributionId: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  grossAmount: number;
  platformSupportAmount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: FirestoreDate;
  paidAt?: FirestoreDate;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: FirestoreDate;
}

export interface ChemaBookEntry {
  id: string;
  displayName: string;
  amount: number;
  currency: string;
  message?: string;
  anonymous: boolean;
  contributionId: string;
  createdAt: FirestoreDate;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  campaignId?: string;
  communityId?: string;
  href?: string;
  createdAt: FirestoreDate;
}

export const USER_ROLES: UserRole[] = [
  "member",
  "campaign_creator",
  "beneficiary",
  "community_admin",
  "platform_admin",
];

export const PRESET_GIVE_AMOUNTS = [10, 20, 50, 100] as const;
export const PRESET_PLATFORM_SUPPORT = [0, 2, 5] as const;

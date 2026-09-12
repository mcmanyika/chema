import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  displayName: z.string().trim().min(1).max(120),
  photoURL: z.string().url().optional().or(z.literal("")),
});

export const createCampaignSchema = z.object({
  title: z.string().trim().min(3).max(140),
  deceasedName: z.string().trim().min(2).max(140),
  organizerRelationship: z.string().trim().min(1).max(80),
  location: z.string().trim().max(160).optional(),
  funeralDate: z.string().optional(),
  description: z.string().trim().min(20, "Please share a little more of the story").max(8000),
  deceasedPhotoUrl: z.string().url().optional().or(z.literal("")),
  beneficiaryType: z.enum(["self", "member"]),
  beneficiaryId: z.string().optional(),
  communityId: z.string().optional(),
  goalAmount: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
});

export const updateCampaignSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  deceasedName: z.string().trim().min(2).max(140).optional(),
  location: z.string().trim().max(160).optional(),
  funeralDate: z.string().optional(),
  description: z.string().trim().min(20).max(8000).optional(),
  deceasedPhotoUrl: z.string().url().optional().or(z.literal("")),
  goalAmount: z.number().int().nonnegative().nullable().optional(),
  status: z
    .enum(["draft", "pending_verification", "active", "paused", "closed"])
    .optional(),
});

export const campaignUpdateSchema = z.object({
  title: z.string().trim().min(2).max(140),
  body: z.string().trim().min(8).max(4000),
});

export const createPaymentIntentSchema = z.object({
  campaignId: z.string().min(1),
  amount: z.number().int().min(100, "Minimum Chema is $1"),
  platformSupportAmount: z.number().int().min(0).default(0),
  anonymous: z.boolean().default(false),
  message: z.string().trim().max(500).optional(),
});

export const reconcilePaymentSchema = z.object({
  contributionId: z.string().min(1),
});

export const createCommunitySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(1000),
  privacy: z.enum(["public", "private"]).default("public"),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
});

export const connectAccountSchema = z.object({
  country: z.string().length(2).default("US"),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
